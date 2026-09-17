package com.shohoj.staff

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.shohoj.staff.data.model.AppUpdateInfo
import com.shohoj.staff.ui.components.AppUpdateDialog
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.navigation.ShohojNavGraph
import com.shohoj.staff.ui.theme.ShohojStaffTheme
import com.shohoj.staff.util.NotificationSyncManager
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var pendingIntentRoute: String? by mutableStateOf(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleNotificationIntent(intent)

        val app = application as ShohojStaffApp
        val startDestination = if (app.sessionManager.isLoggedIn) {
            Screen.Home.route
        } else {
            Screen.Login.route
        }

        setContent {
            ShohojStaffTheme {
                var updateDialogInfo by remember { mutableStateOf<AppUpdateInfo?>(null) }
                var currentVersionName by remember { mutableStateOf("1.0.0") }

                val scope = rememberCoroutineScope()

                // Request Location and Wi-Fi & Notification Permissions
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestMultiplePermissions()
                ) {
                    if (app.sessionManager.isLoggedIn) {
                        scope.launch {
                            NotificationSyncManager.syncAll(this@MainActivity)
                        }
                    }
                }

                LaunchedEffect(Unit) {
                    val permissionsList = mutableListOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.ACCESS_WIFI_STATE
                    )
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                        permissionsList.add(Manifest.permission.POST_NOTIFICATIONS)
                    }
                    val permissions = permissionsList.toTypedArray()
                    val needsRequest = permissions.any {
                        ContextCompat.checkSelfPermission(this@MainActivity, it) != PackageManager.PERMISSION_GRANTED
                    }
                    if (needsRequest) {
                        permissionLauncher.launch(permissions)
                    }

                    if (app.sessionManager.isLoggedIn) {
                        NotificationSyncManager.scheduleBackgroundSync(this@MainActivity)
                        app.startLiveNotificationPoller()
                    }

                    // Check for app update in background on launch
                    try {
                        val result = app.appUpdateRepository.checkForUpdate().getOrNull()
                        if (result != null) {
                            currentVersionName = result.currentVersionName
                            if (result.isUpdateAvailable && result.updateInfo != null) {
                                updateDialogInfo = result.updateInfo
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()

                    LaunchedEffect(pendingIntentRoute) {
                        pendingIntentRoute?.let { route ->
                            if (app.sessionManager.isLoggedIn) {
                                navController.navigate(route) {
                                    launchSingleTop = true
                                }
                            }
                            pendingIntentRoute = null
                        }
                    }

                    ShohojNavGraph(
                        navController = navController,
                        startDestination = startDestination
                    )

                    // In-app Update Notification Popup Dialog
                    updateDialogInfo?.let { info ->
                        AppUpdateDialog(
                            updateInfo = info,
                            currentVersionName = currentVersionName,
                            onDownload = { downloadUrl ->
                                app.appUpdateRepository.downloadAndInstallApk(downloadUrl)
                            },
                            onDismiss = {
                                updateDialogInfo = null
                            }
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleNotificationIntent(intent)
    }

    private fun handleNotificationIntent(intent: Intent?) {
        val targetScreen = intent?.getStringExtra("target_screen") ?: return
        when (targetScreen) {
            "tasks" -> {
                pendingIntentRoute = Screen.Tasks.route
            }
            "announcements" -> {
                pendingIntentRoute = Screen.Announcements.route
            }
            "chat" -> {
                val channelId = intent.getStringExtra("channel_id")
                val channelName = intent.getStringExtra("channel_name") ?: "Chat"
                val channelType = intent.getStringExtra("channel_type") ?: "CHANNEL"
                if (!channelId.isNullOrBlank()) {
                    pendingIntentRoute = Screen.Chat.createRoute(channelId, channelName, channelType)
                } else {
                    pendingIntentRoute = Screen.Community.route
                }
            }
        }
    }
}
