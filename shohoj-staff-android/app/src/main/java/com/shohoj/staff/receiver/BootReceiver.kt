package com.shohoj.staff.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.util.NotificationSyncManager

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == Intent.ACTION_USER_PRESENT
        ) {
            val sessionManager = SessionManager(context.applicationContext)
            if (sessionManager.isLoggedIn) {
                NotificationSyncManager.scheduleBackgroundSync(context.applicationContext)
            }
        }
    }
}
