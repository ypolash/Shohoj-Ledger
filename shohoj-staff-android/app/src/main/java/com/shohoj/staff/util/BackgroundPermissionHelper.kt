package com.shohoj.staff.util

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlarmManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

object BackgroundPermissionHelper {

    /**
     * Check if the app is whitelisted from battery optimizations (Doze mode)
     */
    fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: true
        } else {
            true
        }
    }

    /**
     * Request battery optimization exemption.
     * Launches the system dialog asking the user to allow unrestricted background execution.
     */
    @SuppressLint("BatteryLife")
    fun requestIgnoreBatteryOptimization(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!isIgnoringBatteryOptimizations(context)) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:${context.packageName}")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                    return
                }
            }
        } catch (e: Exception) {
            // Fallback to battery optimization list settings
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(fallbackIntent)
                    return
                }
            } catch (e2: Exception) {
                openAppSettings(context)
            }
        }
    }

    /**
     * Check if exact alarms can be scheduled (Android 12+ API 31+)
     */
    fun canScheduleExactAlarms(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            alarmManager?.canScheduleExactAlarms() ?: true
        } else {
            true
        }
    }

    /**
     * Request Exact Alarm permission on Android 12+
     */
    fun requestExactAlarmPermission(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:${context.packageName}")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            }
        } catch (e: Exception) {
            openAppSettings(context)
        }
    }

    /**
     * Check if notification permission is granted
     */
    fun isNotificationPermissionGranted(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            NotificationManagerCompat.from(context).areNotificationsEnabled()
        }
    }

    /**
     * Open notification settings for this application
     */
    fun openNotificationSettings(context: Context) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            } else {
                openAppSettings(context)
            }
        } catch (e: Exception) {
            openAppSettings(context)
        }
    }

    /**
     * Open system application details settings page
     */
    fun openAppSettings(context: Context) {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Detect device manufacturer
     */
    fun getDeviceManufacturer(): String {
        return Build.MANUFACTURER.lowercase()
    }

    /**
     * Get a human-readable brand name
     */
    fun getDeviceBrandDisplayName(): String {
        val man = getDeviceManufacturer()
        return when {
            man.contains("xiaomi") || man.contains("redmi") || man.contains("poco") -> "Xiaomi / POCO"
            man.contains("samsung") -> "Samsung"
            man.contains("huawei") || man.contains("honor") -> "Huawei / Honor"
            man.contains("oppo") -> "OPPO"
            man.contains("vivo") || man.contains("iqoo") -> "Vivo / iQOO"
            man.contains("realme") -> "Realme"
            man.contains("oneplus") -> "OnePlus"
            man.contains("transsion") || man.contains("infinix") || man.contains("tecno") || man.contains("itel") -> "Tecno / Infinix"
            man.contains("asus") -> "ASUS"
            else -> Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        }
    }

    /**
     * Human-friendly step-by-step instructions for popular phone manufacturers
     */
    fun getAutostartInstructions(): String {
        val man = getDeviceManufacturer()
        return when {
            man.contains("xiaomi") || man.contains("redmi") || man.contains("poco") ->
                "1. Tap 'Open Settings' below\n2. Enable 'Autostart'\n3. Set 'Battery saver' to 'No restrictions'"
            man.contains("samsung") ->
                "1. Tap 'Open Settings' below\n2. Go to 'Battery' -> 'Background usage limits'\n3. Add Shohoj Staff to 'Never sleeping apps'"
            man.contains("huawei") || man.contains("honor") ->
                "1. Tap 'Open Settings' below\n2. Go to 'App Launch' / 'Startup Manager'\n3. Set Shohoj Staff to 'Manage manually' and allow Auto-launch & Run in background"
            man.contains("oppo") || man.contains("realme") ->
                "1. Tap 'Open Settings' below\n2. Enable 'Allow Auto-launch' and 'Allow background activity'\n3. Lock Shohoj Staff in Recent Apps"
            man.contains("vivo") || man.contains("iqoo") ->
                "1. Tap 'Open Settings' below\n2. Enable 'Autostart' and 'High background power consumption'"
            man.contains("transsion") || man.contains("infinix") || man.contains("tecno") ->
                "1. Tap 'Open Settings' below\n2. Go to 'Auto-start management' and enable Shohoj Staff"
            else ->
                "1. Tap 'Open Settings' below\n2. Set Battery usage to 'Unrestricted'\n3. Allow Background Activity & Autostart"
        }
    }

    /**
     * Open OEM-specific Autostart / Background Manager settings screen
     */
    fun openAutostartSettings(context: Context): Boolean {
        val intents = mutableListOf<Intent>()

        val man = getDeviceManufacturer()

        // Xiaomi / MIUI / HyperOS
        if (man.contains("xiaomi") || man.contains("redmi") || man.contains("poco")) {
            intents.add(Intent().setComponent(ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity")))
            intents.add(Intent("miui.intent.action.OP_AUTO_START").addCategory(Intent.CATEGORY_DEFAULT))
        }

        // Samsung
        if (man.contains("samsung")) {
            intents.add(Intent().setComponent(ComponentName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity")))
            intents.add(Intent().setComponent(ComponentName("com.samsung.android.sm", "com.samsung.android.sm.ui.battery.BatteryActivity")))
        }

        // Huawei / Honor
        if (man.contains("huawei") || man.contains("honor")) {
            intents.add(Intent().setComponent(ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity")))
            intents.add(Intent().setComponent(ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity")))
            intents.add(Intent().setComponent(ComponentName("com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity")))
        }

        // Oppo / ColorOS
        if (man.contains("oppo")) {
            intents.add(Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity")))
            intents.add(Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")))
            intents.add(Intent().setComponent(ComponentName("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity")))
        }

        // Vivo
        if (man.contains("vivo") || man.contains("iqoo")) {
            intents.add(Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity")))
            intents.add(Intent().setComponent(ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.PurviewTabActivity")))
            intents.add(Intent().setComponent(ComponentName("com.iqoo.secure", "com.iqoo.secure.safeguard.PurviewTabActivity")))
        }

        // Realme
        if (man.contains("realme")) {
            intents.add(Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity")))
            intents.add(Intent().setComponent(ComponentName("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")))
        }

        // Transsion (Tecno / Infinix)
        if (man.contains("transsion") || man.contains("infinix") || man.contains("tecno") || man.contains("itel")) {
            intents.add(Intent().setComponent(ComponentName("com.transsion.phonemaster", "com.transsion.phonemaster.activity.AppAutoStartActivity")))
            intents.add(Intent().setComponent(ComponentName("com.transsion.phonemaster", "com.transsion.phonemaster.activity.AppStartupActivity")))
        }

        // OnePlus
        if (man.contains("oneplus")) {
            intents.add(Intent().setComponent(ComponentName("com.oneplus.security", "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity")))
        }

        // ASUS
        if (man.contains("asus")) {
            intents.add(Intent().setComponent(ComponentName("com.asus.mobilemanager", "com.asus.mobilemanager.autostart.AutoStartActivity")))
        }

        for (intent in intents) {
            try {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                return true
            } catch (e: Exception) {
                // Try next intent
            }
        }

        // If none of the OEM specific activities worked, open app details
        openAppSettings(context)
        return false
    }
}
