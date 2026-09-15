package com.shohoj.staff.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.core.app.NotificationCompat
import com.shohoj.staff.R

object SoundNotificationHelper {

    private const val CHANNEL_ID = "shohoj_chat_notifications"
    private const val CHANNEL_NAME = "Community & Chat Notifications"
    private const val CHANNEL_DESC = "Notifications and audio chimes for new community messages and pings"
    private var lastPlayTime: Long = 0L

    fun playNotificationSound(context: Context, isMention: Boolean = false) {
        val now = System.currentTimeMillis()
        // Prevent audio flood if multiple messages burst in within 1.5 seconds
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

            // Subtle vibration feedback
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

    fun showNotification(
        context: Context,
        title: String,
        message: String,
        isMention: Boolean = false
    ) {
        try {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = CHANNEL_DESC
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 200, 100, 200)
                    setSound(
                        soundUri,
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                }
                notificationManager.createNotificationChannel(channel)
            }

            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
                flags = android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP or android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = if (launchIntent != null) {
                android.app.PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
                )
            } else null

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
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
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
