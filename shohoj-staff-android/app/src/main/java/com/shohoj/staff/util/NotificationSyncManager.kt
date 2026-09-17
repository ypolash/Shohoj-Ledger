package com.shohoj.staff.util

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.SystemClock
import androidx.work.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.receiver.NotificationAlarmReceiver
import com.shohoj.staff.worker.NotificationSyncWorker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

object NotificationSyncManager {

    private const val PREFS_NAME = "shohoj_notifications_tracker"
    private const val KEY_SEEN_TASK_IDS = "seen_task_ids"
    private const val KEY_SEEN_NOTICE_IDS = "seen_notice_ids"
    private const val KEY_CHANNEL_UNREAD_MAP = "channel_unread_map"
    private const val KEY_IS_INITIALIZED = "is_sync_initialized"

    private const val WORK_NAME_PERIODIC = "ShohojPeriodicNotificationSync"
    private const val WORK_NAME_ONE_TIME = "ShohojOneTimeNotificationSync"

    private const val ALARM_INTERVAL_MS = 30_000L // 30 seconds interval for real-time background sync

    private val gson = Gson()

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Enqueue both AlarmManager repeating wakeups and WorkManager background jobs
     * so notifications pop up even when the app is swiped away or the phone is in doze mode.
     */
    fun scheduleBackgroundSync(context: Context) {
        try {
            // 1. AlarmManager exact recurring alarm (every 30s)
            scheduleNextAlarm(context)

            // 2. WorkManager backup periodic worker (every 15 mins)
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val periodicWorkRequest = PeriodicWorkRequestBuilder<NotificationSyncWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME_PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWorkRequest
            )

            // 3. Immediate one-time worker
            val oneTimeRequest = OneTimeWorkRequestBuilder<NotificationSyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                WORK_NAME_ONE_TIME,
                ExistingWorkPolicy.REPLACE,
                oneTimeRequest
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Schedules the next exact alarm wakeup
     */
    fun scheduleNextAlarm(context: Context) {
        try {
            val sessionManager = SessionManager(context.applicationContext)
            if (!sessionManager.isLoggedIn) return

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context.applicationContext, NotificationAlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context.applicationContext,
                1001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerTime = SystemClock.elapsedRealtime() + ALARM_INTERVAL_MS

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun cancelBackgroundSync(context: Context) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            val intent = Intent(context.applicationContext, NotificationAlarmReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                context.applicationContext,
                1001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            if (alarmManager != null && pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
            }

            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME_PERIODIC)
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME_ONE_TIME)

            // Reset seen tracker on logout
            getPrefs(context).edit().clear().apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Synchronizes tasks, notices, and chat channels, and issues system notifications for new arrivals.
     * Works standalone without UI dependency.
     */
    suspend fun syncAll(context: Context): Boolean = withContext(Dispatchers.IO) {
        try {
            val sessionManager = SessionManager(context.applicationContext)
            if (!sessionManager.isLoggedIn) return@withContext false

            val apiClient = ApiClient(context.applicationContext)
            val service = apiClient.getService()
            val prefs = getPrefs(context)

            val isInitialized = prefs.getBoolean(KEY_IS_INITIALIZED, false)
            var hasSyncSuccess = false

            // 1. Sync Tasks (Regular & Special Bounties)
            try {
                val taskRes = service.getTasks()
                if (taskRes.isSuccessful && taskRes.body() != null) {
                    hasSyncSuccess = true
                    val taskList = taskRes.body()?.tasks ?: emptyList()
                    val seenTasks = prefs.getStringSet(KEY_SEEN_TASK_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()

                    if (!isInitialized) {
                        taskList.forEach { seenTasks.add(it.id) }
                    } else {
                        taskList.forEach { task ->
                            if (!seenTasks.contains(task.id)) {
                                SoundNotificationHelper.showTaskNotification(context, task)
                                seenTasks.add(task.id)
                            }
                        }
                    }
                    prefs.edit().putStringSet(KEY_SEEN_TASK_IDS, seenTasks).apply()
                }
            } catch (e: Exception) {
                // Task sync quiet catch
            }

            // 2. Sync Company Notices / Announcements
            try {
                val noticeRes = service.getAnnouncements()
                if (noticeRes.isSuccessful && noticeRes.body() != null) {
                    hasSyncSuccess = true
                    val notices = noticeRes.body()?.announcements ?: emptyList()
                    val seenNotices = prefs.getStringSet(KEY_SEEN_NOTICE_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()

                    if (!isInitialized) {
                        notices.forEach { seenNotices.add(it.id) }
                    } else {
                        notices.forEach { notice ->
                            if (!seenNotices.contains(notice.id)) {
                                SoundNotificationHelper.showNoticeNotification(context, notice)
                                seenNotices.add(notice.id)
                            }
                        }
                    }
                    prefs.edit().putStringSet(KEY_SEEN_NOTICE_IDS, seenNotices).apply()
                }
            } catch (e: Exception) {
                // Notice sync quiet catch
            }

            // 3. Sync Community & Direct Chat Messages
            try {
                val channelRes = service.getCommunityChannels()
                if (channelRes.isSuccessful && channelRes.body() != null) {
                    hasSyncSuccess = true
                    val channels = channelRes.body()?.channels ?: emptyList()

                    val savedMapJson = prefs.getString(KEY_CHANNEL_UNREAD_MAP, "{}") ?: "{}"
                    val type = object : TypeToken<Map<String, ChannelSyncState>>() {}.type
                    val prevMap: MutableMap<String, ChannelSyncState> = try {
                        gson.fromJson(savedMapJson, type) ?: mutableMapOf()
                    } catch (e: Exception) {
                        mutableMapOf()
                    }

                    val currentMap = mutableMapOf<String, ChannelSyncState>()

                    channels.forEach { channel ->
                        val lastMsg = channel.lastMessage
                        val lastMsgContent = lastMsg?.content ?: ""
                        val lastMsgTime = lastMsg?.createdAt ?: ""
                        val unreadCount = channel.unreadCount

                        val state = ChannelSyncState(
                            unreadCount = unreadCount,
                            lastMessageContent = lastMsgContent,
                            lastMessageTime = lastMsgTime
                        )
                        currentMap[channel.id] = state

                        if (isInitialized) {
                            val prevState = prevMap[channel.id]
                            val hasNewUnread = unreadCount > 0 && (
                                prevState == null ||
                                unreadCount > prevState.unreadCount ||
                                (lastMsgTime.isNotBlank() && lastMsgTime != prevState.lastMessageTime)
                            )

                            if (hasNewUnread) {
                                val myEmp = sessionManager.getEmployee()
                                val myName = myEmp?.displayName ?: ""
                                val isMention = lastMsgContent.contains("@${myEmp?.firstName}", ignoreCase = true) ||
                                                lastMsgContent.contains("@$myName", ignoreCase = true)

                                SoundNotificationHelper.showChatNotification(
                                    context = context,
                                    channel = channel,
                                    messageContent = lastMsgContent,
                                    senderName = lastMsg?.senderName,
                                    isMention = isMention
                                )
                            }
                        }
                    }

                    prefs.edit().putString(KEY_CHANNEL_UNREAD_MAP, gson.toJson(currentMap)).apply()
                }
            } catch (e: Exception) {
                // Chat sync quiet catch
            }

            if (!isInitialized && hasSyncSuccess) {
                prefs.edit().putBoolean(KEY_IS_INITIALIZED, true).apply()
            }

            return@withContext hasSyncSuccess
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext false
        }
    }

    private data class ChannelSyncState(
        val unreadCount: Int = 0,
        val lastMessageContent: String = "",
        val lastMessageTime: String = ""
    )
}
