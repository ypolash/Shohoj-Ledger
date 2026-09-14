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
    object Community : Screen("community")
    object Chat : Screen("chat/{channelId}/{channelName}/{channelType}") {
        fun createRoute(channelId: String, channelName: String, channelType: String): String {
            val encodedName = java.net.URLEncoder.encode(channelName, "UTF-8")
            return "chat/$channelId/$encodedName/$channelType"
        }
    }
}
