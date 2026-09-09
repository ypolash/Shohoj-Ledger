package com.shohoj.staff.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.shohoj.staff.ui.theme.*

sealed class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
) {
    object Home : BottomNavItem("home", "Home", Icons.Default.Home)
    object Attendance : BottomNavItem("attendance", "Attendance", Icons.Default.Fingerprint)
    object Tasks : BottomNavItem("tasks", "Tasks", Icons.Default.CheckCircle)
    object Leave : BottomNavItem("leave", "Leave", Icons.Default.CalendarToday)
    object Profile : BottomNavItem("profile", "Profile", Icons.Default.Person)
}

@Composable
fun ShohojBottomBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.Attendance,
        BottomNavItem.Tasks,
        BottomNavItem.Leave,
        BottomNavItem.Profile
    )

    NavigationBar(
        containerColor = Slate900,
        contentColor = Slate300,
        tonalElevation = 8.dp,
        modifier = Modifier.height(72.dp)
    ) {
        items.forEach { item ->
            val isSelected = currentRoute == item.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(item.route) },
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Emerald500,
                    selectedTextColor = Emerald500,
                    unselectedIconColor = Slate400,
                    unselectedTextColor = Slate400,
                    indicatorColor = Slate800
                )
            )
        }
    }
}
