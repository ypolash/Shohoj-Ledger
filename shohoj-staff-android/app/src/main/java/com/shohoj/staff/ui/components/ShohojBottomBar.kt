package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
    object Attendance : BottomNavItem("attendance", "Attendance", Icons.Outlined.ReceiptLong, Icons.Filled.ReceiptLong)
    object Community : BottomNavItem("community", "People", Icons.Outlined.People, Icons.Filled.People)
    object Tasks : BottomNavItem("tasks", "Tasks", Icons.Outlined.Assignment, Icons.Filled.Assignment)
    object Profile : BottomNavItem("profile", "Profile", Icons.Outlined.Person, Icons.Filled.Person)
}

@Composable
fun ShohojBottomBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    onCenterAction: (() -> Unit)? = null
) {
    val leftItems = listOf(BottomNavItem.Home, BottomNavItem.Attendance)
    val rightItems = listOf(BottomNavItem.Community, BottomNavItem.Profile)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding(),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Elevated clean white bottom bar
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(68.dp)
                .shadow(elevation = 16.dp, shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)),
            color = Color.White,
            shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Left 2 items
                leftItems.forEach { item ->
                    val isSelected = currentRoute == item.route
                    BottomBarNavItem(
                        modifier = Modifier.weight(1f),
                        item = item,
                        isSelected = isSelected,
                        onClick = { onNavigate(item.route) }
                    )
                }

                // Middle spacer for center raised button
                Spacer(modifier = Modifier.width(72.dp))

                // Right 2 items
                rightItems.forEach { item ->
                    val isSelected = currentRoute == item.route
                    BottomBarNavItem(
                        modifier = Modifier.weight(1f),
                        item = item,
                        isSelected = isSelected,
                        onClick = { onNavigate(item.route) }
                    )
                }
            }
        }

        // Floating Center Coral-Red Gradient Action Button (Nagad Style)
        Box(
            modifier = Modifier
                .offset(y = (-18).dp)
                .size(62.dp)
                .shadow(elevation = 12.dp, shape = CircleShape)
                .clip(CircleShape)
                .background(
                    brush = Brush.radialGradient(
                        listOf(
                            NagadOrangeLight,
                            NagadOrange,
                            NagadRed
                        )
                    )
                )
                .border(3.5.dp, Color.White, CircleShape)
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    if (onCenterAction != null) {
                        onCenterAction()
                    } else {
                        onNavigate(BottomNavItem.Attendance.route)
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.QrCodeScanner,
                contentDescription = "Quick Punch / Scanner",
                tint = Color.White,
                modifier = Modifier.size(28.dp)
            )
        }
    }
}

@Composable
private fun BottomBarNavItem(
    modifier: Modifier = Modifier,
    item: BottomNavItem,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxHeight()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = if (isSelected) item.selectedIcon else item.icon,
            contentDescription = item.label,
            tint = if (isSelected) NagadOrange else Color(0xFF64748B),
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = item.label,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) NagadOrange else Color(0xFF64748B)
        )
    }
}
