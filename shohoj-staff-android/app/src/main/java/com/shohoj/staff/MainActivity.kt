package com.shohoj.staff

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.rememberNavController
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.navigation.ShohojNavGraph
import com.shohoj.staff.ui.theme.ShohojStaffTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as ShohojStaffApp
        val startDestination = if (app.sessionManager.isLoggedIn) {
            Screen.Home.route
        } else {
            Screen.Login.route
        }

        setContent {
            ShohojStaffTheme {
                // Request Location and Wi-Fi Permissions on start for geofenced attendance
                val permissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestMultiplePermissions()
                ) { /* Permissions evaluated */ }

                LaunchedEffect(Unit) {
                    val permissions = arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.ACCESS_WIFI_STATE
                    )
                    val needsRequest = permissions.any {
                        ContextCompat.checkSelfPermission(this@MainActivity, it) != PackageManager.PERMISSION_GRANTED
                    }
                    if (needsRequest) {
                        permissionLauncher.launch(permissions)
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    ShohojNavGraph(
                        navController = navController,
                        startDestination = startDestination
                    )
                }
            }
        }
    }
}
