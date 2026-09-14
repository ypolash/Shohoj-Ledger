package com.shohoj.staff.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.shohoj.staff.ui.screens.announcements.AnnouncementScreen
import com.shohoj.staff.ui.screens.attendance.AttendanceScreen
import com.shohoj.staff.ui.screens.community.CommunityChannelsScreen
import com.shohoj.staff.ui.screens.community.CommunityChatScreen
import com.shohoj.staff.ui.screens.home.HomeScreen
import com.shohoj.staff.ui.screens.leave.LeaveScreen
import com.shohoj.staff.ui.screens.login.LoginScreen
import com.shohoj.staff.ui.screens.payroll.PayrollScreen
import com.shohoj.staff.ui.screens.profile.ProfileScreen
import com.shohoj.staff.ui.screens.tasks.TaskScreen

@Composable
fun ShohojNavGraph(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                onNavigate = { route ->
                    if (route != Screen.Home.route) {
                        navController.navigate(route) {
                            launchSingleTop = true
                        }
                    }
                }
            )
        }

        composable(Screen.Attendance.route) {
            AttendanceScreen(
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Leave.route) {
            LeaveScreen(
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Payroll.route) {
            PayrollScreen(
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Tasks.route) {
            TaskScreen(
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Community.route) {
            CommunityChannelsScreen(
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                },
                onNavigateToChat = { channelId, channelName, channelType ->
                    val route = Screen.Chat.createRoute(channelId, channelName, channelType)
                    navController.navigate(route)
                }
            )
        }

        composable(
            route = Screen.Chat.route,
            arguments = listOf(
                navArgument("channelId") { type = NavType.StringType },
                navArgument("channelName") { type = NavType.StringType },
                navArgument("channelType") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val channelId = backStackEntry.arguments?.getString("channelId") ?: ""
            val rawName = backStackEntry.arguments?.getString("channelName") ?: "Chat"
            val channelName = try {
                java.net.URLDecoder.decode(rawName, "UTF-8")
            } catch (e: Exception) {
                rawName
            }
            val channelType = backStackEntry.arguments?.getString("channelType") ?: "CHANNEL"

            CommunityChatScreen(
                channelId = channelId,
                channelName = channelName,
                channelType = channelType,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Announcements.route) {
            AnnouncementScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Home.route)
                        launchSingleTop = true
                    }
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}
