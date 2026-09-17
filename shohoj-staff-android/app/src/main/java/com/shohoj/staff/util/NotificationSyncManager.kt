package com.shohoj.staff.util

import android.content.Context
import android.content.SharedPreferences
import androidx.work.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.CommunityChannel
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

    private val gson = Gson()

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    /**
     * Enqueue background WorkManager jobs to poll in the background even when app is killed
     */
    fun scheduleBackgroundSync(context: Context) {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            // 1. Periodic background worker (every 15 mins)
            val periodicWorkRequest = PeriodicWorkRequestBuilder<NotificationSyncWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES // Flex interval
            )
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME_PERIODIC,
                ExistingPeriodicWorkPolicy.KEEP,
                periodicWorkRequest
            )

            // 2. Immediate one-time sync
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

    fun cancelBackgroundSync(context: Context) {
        try {
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
     */
    suspend fun syncAll(context: Context): Boolean = withContext(Dispatchers.IO) {
        val app = context.applicationContext as? ShohojStaffApp ?: return@withContext false
        val sessionManager = app.sessionManager
        if (!sessionManager.isLoggedIn) return@withContext false

        val apiClient = app.apiClient
        val service = apiClient.getService()
        val prefs = getPrefs(context)

        val isInitialized = prefs.getBoolean(KEY_IS_INITIALIZED, false)

        var hasSyncSuccess = false

        // 1. Sync Tasks (Regular & Special)
        try {
            val taskRes = service.getTasks()
            if (taskRes.isSuccessful && taskRes.body() != null) {
                hasSyncSuccess = true
                val taskList = taskRes.body()?.tasks ?: emptyList()
                val seenTasks = prefs.getStringSet(KEY_SEEN_TASK_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()

                if (!isInitialized) {
                    // First run baseline: register all current tasks as seen so we don't burst
                    taskList.forEach { seenTasks.add(it.id) }
                } else {
                    taskList.forEach { task ->
                        if (!seenTasks.contains(task.id)) {
                            // New Task discovered! Notify user
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
                            // New Notice discovered! Notify user
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
    }

    private data class ChannelSyncState(
        val unreadCount: Int = 0,
        val lastMessageContent: String = "",
        val lastMessageTime: String = ""
    )
}
