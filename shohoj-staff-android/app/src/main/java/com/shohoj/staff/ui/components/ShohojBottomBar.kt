package com.shohoj.staff.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.*

sealed class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val selectedIcon: ImageVector = icon
) {
    object Home : BottomNavItem("home", "Home", Icons.Outlined.Home, Icons.Filled.Home)
    object Attendance : BottomNavItem("attendance", "Attendance", Icons.Outlined.Fingerprint, Icons.Filled.Fingerprint)
    object Community : BottomNavItem("community", "Community", Icons.Outlined.Forum, Icons.Filled.Forum)
    object Tasks : BottomNavItem("tasks", "Tasks", Icons.Outlined.CheckCircle, Icons.Filled.CheckCircle)
    object Profile : BottomNavItem("profile", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
}

@Composable
fun ShohojBottomBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem.Home,
        BottomNavItem.Attendance,
        BottomNavItem.Community,
        BottomNavItem.Tasks,
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
                        imageVector = if (isSelected) item.selectedIcon else item.icon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                        )
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Emerald400,
                    selectedTextColor = Emerald400,
                    unselectedIconColor = Slate400,
                    unselectedTextColor = Slate400,
                    indicatorColor = Emerald500.copy(alpha = 0.15f)
                )
            )
        }
    }
}
