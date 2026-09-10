package com.shohoj.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.shohoj.admin.ui.navigation.AdminNavGraph
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.ShohojAdminTheme
import com.shohoj.admin.ui.theme.Slate950

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as ShohojAdminApp
        val repository = app.repository
        val isLoggedIn = repository.sessionManager.isLoggedIn

        setContent {
            ShohojAdminTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Slate950
                ) {
                    val navController = rememberNavController()
                    val startDestination = if (isLoggedIn) Screen.Dashboard.route else Screen.Login.route

                    AdminNavGraph(
                        navController = navController,
                        repository = repository,
                        startDestination = startDestination
                    )
                }
            }
        }
    }
}
