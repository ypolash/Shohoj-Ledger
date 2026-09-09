package com.shohoj.staff.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.shohoj.staff.ui.screens.announcements.AnnouncementScreen
import com.shohoj.staff.ui.screens.attendance.AttendanceScreen
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
