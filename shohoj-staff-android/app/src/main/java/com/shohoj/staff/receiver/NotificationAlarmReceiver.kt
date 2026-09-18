package com.shohoj.staff.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import com.shohoj.staff.util.NotificationSyncManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val wakeLock = powerManager?.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ShohojStaff::AlarmWakeLock"
        )
        wakeLock?.acquire(15_000L) // 15 seconds max timeout

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                NotificationSyncManager.syncAll(context.applicationContext)
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                // Schedule the next background cycle
                NotificationSyncManager.scheduleNextAlarm(context.applicationContext)
                try {
                    if (wakeLock?.isHeld == true) {
                        wakeLock.release()
                    }
                } catch (e: Exception) {
                    // Ignore wakelock release exceptions
                }
                pendingResult.finish()
            }
        }
    }
}
