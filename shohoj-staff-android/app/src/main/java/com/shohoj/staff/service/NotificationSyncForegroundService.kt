package com.shohoj.staff.service

import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.shohoj.staff.MainActivity
import com.shohoj.staff.R
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.util.NotificationSyncManager
import com.shohoj.staff.util.SoundNotificationHelper
import kotlinx.coroutines.*

class NotificationSyncForegroundService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var syncJob: Job? = null

    companion object {
        const val ACTION_START_SERVICE = "com.shohoj.staff.action.START_SYNC_SERVICE"
        const val ACTION_STOP_SERVICE = "com.shohoj.staff.action.STOP_SYNC_SERVICE"
        private const val NOTIFICATION_ID = 8801

        @Volatile
        var isServiceRunning = false
            private set

        fun start(context: Context) {
            try {
                val intent = Intent(context, NotificationSyncForegroundService::class.java).apply {
                    action = ACTION_START_SERVICE
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ContextCompat.startForegroundService(context, intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, NotificationSyncForegroundService::class.java).apply {
                    action = ACTION_STOP_SERVICE
                }
                context.startService(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        SoundNotificationHelper.initNotificationChannels(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START_SERVICE

        if (action == ACTION_STOP_SERVICE) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        startForegroundWithNotification()
        startPeriodicSyncLoop()

        return START_STICKY
    }

    private fun startForegroundWithNotification() {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, SoundNotificationHelper.CHANNEL_PERSISTENT_SERVICE_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Shohoj Staff • Background Sync")
            .setContentText("Monitoring tasks, notices, and chat notifications")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        isServiceRunning = true
    }

    private fun startPeriodicSyncLoop() {
        syncJob?.cancel()
        syncJob = serviceScope.launch {
            val sessionManager = SessionManager(applicationContext)

            while (isActive) {
                try {
                    if (!sessionManager.isLoggedIn) {
                        stopForegroundService()
                        break
                    }
                    NotificationSyncManager.syncAll(applicationContext)
                } catch (e: Exception) {
                    // Ignore sync errors in loop
                }
                // Run sync every 20 seconds while foreground service is active
                delay(20_000L)
            }
        }
    }

    private fun stopForegroundService() {
        isServiceRunning = false
        syncJob?.cancel()
        syncJob = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceRunning = false
        syncJob?.cancel()
        serviceScope.cancel()
    }
}
