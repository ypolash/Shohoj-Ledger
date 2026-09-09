package com.shohoj.staff.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Home : Screen("home")
    object Attendance : Screen("attendance")
    object Leave : Screen("leave")
    object Payroll : Screen("payroll")
    object Tasks : Screen("tasks")
    object Announcements : Screen("announcements")
    object Profile : Screen("profile")
}
