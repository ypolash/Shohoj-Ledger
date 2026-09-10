package com.shohoj.admin.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector? = null) {
    object Login : Screen("login", "Sign In")
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Employees : Screen("employees", "Employees", Icons.Default.People)
    object Attendance : Screen("attendance", "Attendance", Icons.Default.AccessTime)
    object Projects : Screen("projects", "Projects", Icons.Default.Work)
    object Leads : Screen("leads", "Leads", Icons.Default.TrendingUp)
    object Finance : Screen("finance", "Financials", Icons.Default.AccountBalance)
    object Leaves : Screen("leaves", "Leave Requests", Icons.Default.DateRange)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)

    companion object {
        // Bottom Navigation Bar items
        val bottomNavItems = listOf(
            Dashboard,
            Employees,
            Attendance,
            Projects,
            Finance
        )
    }
}
