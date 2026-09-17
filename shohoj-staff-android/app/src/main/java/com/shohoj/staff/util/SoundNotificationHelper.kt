package com.shohoj.staff.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.shohoj.staff.MainActivity
import com.shohoj.staff.R
import com.shohoj.staff.data.model.AnnouncementItem
import com.shohoj.staff.data.model.CommunityChannel
import com.shohoj.staff.data.model.TaskItem

object SoundNotificationHelper {

    const val CHANNEL_TASKS_ID = "shohoj_tasks_notifications"
    const val CHANNEL_TASKS_NAME = "Tasks & Assignments"
    const val CHANNEL_TASKS_DESC = "Notifications for newly assigned tasks and special reward bounties"

    const val CHANNEL_NOTICES_ID = "shohoj_notices_notifications"
    const val CHANNEL_NOTICES_NAME = "Company Notices & Announcements"
    const val CHANNEL_NOTICES_DESC = "Important announcements and company-wide notices"

    const val CHANNEL_CHAT_ID = "shohoj_chat_notifications"
    const val CHANNEL_CHAT_NAME = "Community & Chat Messages"
    const val CHANNEL_CHAT_DESC = "Instant notifications and pings for team chats and direct messages"

    private var lastPlayTime: Long = 0L

    fun initNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val audioAttr = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            // 1. Tasks Channel
            val tasksChannel = NotificationChannel(
                CHANNEL_TASKS_ID,
                CHANNEL_TASKS_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_TASKS_DESC
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 250, 150, 250)
                setSound(soundUri, audioAttr)
            }
            notificationManager.createNotificationChannel(tasksChannel)

            // 2. Notices Channel
            val noticesChannel = NotificationChannel(
                CHANNEL_NOTICES_ID,
                CHANNEL_NOTICES_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_NOTICES_DESC
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 100, 300)
                setSound(soundUri, audioAttr)
            }
            notificationManager.createNotificationChannel(noticesChannel)

            // 3. Chat Channel
            val chatChannel = NotificationChannel(
                CHANNEL_CHAT_ID,
                CHANNEL_CHAT_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = CHANNEL_CHAT_DESC
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 200, 100, 200)
                setSound(soundUri, audioAttr)
            }
            notificationManager.createNotificationChannel(chatChannel)
        }
    }

    fun playNotificationSound(context: Context, isMention: Boolean = false) {
        val now = System.currentTimeMillis()
        if (now - lastPlayTime < 1500) return
        lastPlayTime = now

        try {
            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val ringtone = RingtoneManager.getRingtone(context.applicationContext, soundUri)
            ringtone?.let {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    it.audioAttributes = AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                }
                it.play()
            }

            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val duration = if (isMention) 250L else 120L
                vibrator?.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(if (isMention) 250L else 120L)
            }
        } catch (e: Exception) {
            // Audio fallback quiet catch
        }
    }

    fun showTaskNotification(context: Context, task: TaskItem) {
        try {
            initNotificationChannels(context)
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val isSpecial = task.isSpecialTask
            val title = if (isSpecial) {
                "⭐ Special Task Available: ${task.title}"
            } else {
                "📋 New Task Assigned: ${task.title}"
            }

            val pointsText = if (task.points != null && task.points > 0) "${task.points} Pts" else ""
            val rewardText = if (task.rewardAmount != null && task.rewardAmount > 0) "৳${task.rewardAmount.toInt()}" else ""
            val bountyBadge = listOf(pointsText, rewardText).filter { it.isNotBlank() }.joinToString(" • ")

            val body = when {
                isSpecial && bountyBadge.isNotBlank() -> "Bounty: $bountyBadge | ${task.description ?: "Earn rewards upon completion"}"
                task.description?.isNotBlank() == true -> task.description
                task.priority?.isNotBlank() == true -> "Priority: ${task.priority} | Due: ${task.dueDate ?: "Open"}"
                else -> "A new task has been assigned to you. Tap to review."
            }

            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("target_screen", "tasks")
                putExtra("task_id", task.id)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                ("task_" + task.id).hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_TASKS_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_EVENT)
                .setAutoCancel(true)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)

            val notifId = ("task_" + task.id).hashCode()
            notificationManager.notify(notifId, builder.build())
            playNotificationSound(context, isMention = isSpecial)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun showNoticeNotification(context: Context, announcement: AnnouncementItem) {
        try {
            initNotificationChannels(context)
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val isUrgent = announcement.type == "URGENT" || announcement.type == "IMPORTANT"
            val title = if (isUrgent) {
                "🚨 Urgent Notice: ${announcement.title}"
            } else {
                "📢 Company Notice: ${announcement.title}"
            }

            val body = announcement.content.ifBlank { "New announcement from HR Department. Tap to view." }

            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("target_screen", "announcements")
                putExtra("notice_id", announcement.id)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                ("notice_" + announcement.id).hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_NOTICES_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)

            val notifId = ("notice_" + announcement.id).hashCode()
            notificationManager.notify(notifId, builder.build())
            playNotificationSound(context, isMention = isUrgent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun showChatNotification(
        context: Context,
        channel: CommunityChannel,
        messageContent: String? = null,
        senderName: String? = null,
        isMention: Boolean = false
    ) {
        try {
            initNotificationChannels(context)
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val channelName = channel.name.ifBlank { "Chat" }
            val sender = senderName ?: channel.lastMessage?.senderName ?: "Colleague"
            val body = messageContent ?: channel.lastMessage?.content ?: "Sent a new message"

            val title = if (channel.type == "DIRECT_MESSAGE") {
                if (isMention) "🔔 Message from $sender" else "💬 Message from $sender"
            } else {
                if (isMention) "🔔 Mentioned by $sender in #$channelName" else "💬 #$channelName • $sender"
            }

            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("target_screen", "chat")
                putExtra("channel_id", channel.id)
                putExtra("channel_name", channel.name)
                putExtra("channel_type", channel.type)
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                ("chat_" + channel.id).hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(context, CHANNEL_CHAT_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setContentIntent(pendingIntent)

            val notifId = ("chat_" + channel.id).hashCode()
            notificationManager.notify(notifId, builder.build())
            playNotificationSound(context, isMention = isMention)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun showNotification(
        context: Context,
        title: String,
        message: String,
        isMention: Boolean = false
    ) {
        try {
            initNotificationChannels(context)
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = if (launchIntent != null) {
                PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            } else null

            val builder = NotificationCompat.Builder(context, CHANNEL_CHAT_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(if (isMention) "🔔 $title" else title)
                .setContentText(message)
                .setStyle(NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setAutoCancel(true)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setDefaults(NotificationCompat.DEFAULT_ALL)

            if (pendingIntent != null) {
                builder.setContentIntent(pendingIntent)
            }

            val notifId = (System.currentTimeMillis() % 100000).toInt()
            notificationManager.notify(notifId, builder.build())
            playNotificationSound(context, isMention = isMention)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
