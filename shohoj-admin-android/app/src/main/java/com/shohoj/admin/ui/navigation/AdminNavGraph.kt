package com.shohoj.admin.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.shohoj.admin.data.repository.AdminRepository
import com.shohoj.admin.ui.screens.attendance.AttendanceViewModel
import com.shohoj.admin.ui.screens.attendance.TodayAttendanceScreen
import com.shohoj.admin.ui.screens.dashboard.DashboardScreen
import com.shohoj.admin.ui.screens.dashboard.DashboardViewModel
import com.shohoj.admin.ui.screens.employees.EmployeesScreen
import com.shohoj.admin.ui.screens.employees.EmployeesViewModel
import com.shohoj.admin.ui.screens.finance.FinanceScreen
import com.shohoj.admin.ui.screens.finance.FinanceViewModel
import com.shohoj.admin.ui.screens.leads.LeadsScreen
import com.shohoj.admin.ui.screens.leads.LeadsViewModel
import com.shohoj.admin.ui.screens.login.LoginScreen
import com.shohoj.admin.ui.screens.login.LoginViewModel
import com.shohoj.admin.ui.screens.projects.ProjectsScreen
import com.shohoj.admin.ui.screens.projects.ProjectsViewModel
import com.shohoj.admin.ui.screens.leaves.LeavesScreen
import com.shohoj.admin.ui.screens.leaves.LeavesViewModel
import com.shohoj.admin.ui.screens.settings.SettingsScreen

@Composable
fun AdminNavGraph(
    navController: NavHostController,
    repository: AdminRepository,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            val loginViewModel = viewModel { LoginViewModel(repository) }
            LoginScreen(
                viewModel = loginViewModel,
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            val dashboardViewModel = viewModel { DashboardViewModel(repository) }
            DashboardScreen(
                viewModel = dashboardViewModel,
                onNavigate = { route ->
                    if (route != Screen.Dashboard.route) {
                        navController.navigate(route) {
                            launchSingleTop = true
                        }
                    }
                }
            )
        }

        composable(Screen.Employees.route) {
            val employeesViewModel = viewModel { EmployeesViewModel(repository) }
            EmployeesScreen(
                viewModel = employeesViewModel,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Attendance.route) {
            val attendanceViewModel = viewModel { AttendanceViewModel(repository) }
            TodayAttendanceScreen(
                viewModel = attendanceViewModel,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Projects.route) {
            val projectsViewModel = viewModel { ProjectsViewModel(repository) }
            ProjectsScreen(
                viewModel = projectsViewModel,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Leads.route) {
            val leadsViewModel = viewModel { LeadsViewModel(repository) }
            LeadsScreen(
                viewModel = leadsViewModel,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Finance.route) {
            val financeViewModel = viewModel { FinanceViewModel(repository) }
            FinanceScreen(
                viewModel = financeViewModel,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Leaves.route) {
            val leavesViewModel = viewModel { LeavesViewModel(repository) }
            LeavesScreen(
                viewModel = leavesViewModel,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                repository = repository,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(Screen.Dashboard.route)
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
