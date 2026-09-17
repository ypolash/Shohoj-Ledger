package com.shohoj.staff.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.shohoj.staff.util.NotificationSyncManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class NotificationAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                NotificationSyncManager.syncAll(context.applicationContext)
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                // Schedule the next background cycle
                NotificationSyncManager.scheduleNextAlarm(context.applicationContext)
                pendingResult.finish()
            }
        }
    }
}
