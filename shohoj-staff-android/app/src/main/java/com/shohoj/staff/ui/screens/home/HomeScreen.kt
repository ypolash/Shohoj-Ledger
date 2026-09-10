package com.shohoj.staff.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils

@Composable
fun HomeScreen(
    onNavigate: (String) -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    val today = uiState.todayAttendance
    val isCheckedIn = today?.checkInTime != null || today?.checkIn != null
    val isCheckedOut = today?.checkOutTime != null || today?.checkOut != null

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "Shohoj Staff",
                subtitle = uiState.employee?.displayName ?: "Employee Portal",
                onNotificationsClick = { onNavigate(Screen.Announcements.route) }
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Home.route,
                onNavigate = onNavigate
            )
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(scrollState)
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Live Clock & Date Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.linearGradient(listOf(Slate900, Slate800)),
                        shape = RoundedCornerShape(18.dp)
                    )
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
                    .padding(20.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = uiState.currentDateString.ifEmpty { "Today" },
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Emerald400,
                            fontWeight = FontWeight.Medium
                        )
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = uiState.currentTimeString.ifEmpty { "--:--:--" },
                        style = MaterialTheme.typography.headlineLarge.copy(
                            fontSize = 34.sp,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 1.5.sp,
                            color = Slate50
                        )
                    )
                }
            }

            // Status Message Feedback Banner
            if (uiState.clockActionSuccessMessage != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Emerald500.copy(alpha = 0.15f), shape = RoundedCornerShape(10.dp))
                        .border(1.dp, Emerald500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald400, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = uiState.clockActionSuccessMessage!!,
                            style = MaterialTheme.typography.bodyMedium.copy(color = Emerald400, fontSize = 13.sp)
                        )
                    }
                }
            }

            if (uiState.error != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Rose500.copy(alpha = 0.15f), shape = RoundedCornerShape(10.dp))
                        .border(1.dp, Rose500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                        .padding(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Rose400, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = uiState.error!!,
                            style = MaterialTheme.typography.bodyMedium.copy(color = Rose400, fontSize = 13.sp)
                        )
                    }
                }
            }

            // Quick Attendance Widget Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(color = CardBackground, shape = RoundedCornerShape(18.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
                    .padding(20.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Today's Attendance",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate50
                            )
                        )
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            if ((today?.lateMinutes ?: 0) > 0) {
                                Text(
                                    text = "+${today?.lateMinutes}m late",
                                    color = Amber500,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            StatusBadge(
                                status = when {
                                    today?.isLate == true || (today?.lateMinutes ?: 0) > 0 -> "LATE"
                                    isCheckedOut -> "COMPLETED"
                                    isCheckedIn -> "CLOCKED IN"
                                    else -> "NOT CLOCKED IN"
                                }
                            )
                        }
                    }

                    // Times Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Check In", style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp))
                            Text(
                                text = DateUtils.formatTime(today?.displayCheckIn),
                                style = MaterialTheme.typography.titleMedium.copy(color = Slate50, fontWeight = FontWeight.SemiBold)
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Check Out", style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp))
                            Text(
                                text = DateUtils.formatTime(today?.displayCheckOut),
                                style = MaterialTheme.typography.titleMedium.copy(color = Slate50, fontWeight = FontWeight.SemiBold)
                            )
                        }
                    }

                    // Action Button
                    Button(
                        onClick = { viewModel.performQuickClockAction() },
                        enabled = !uiState.isClocking && (!isCheckedIn || !isCheckedOut),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (!isCheckedIn) Emerald500 else Rose500,
                            contentColor = Slate950,
                            disabledContainerColor = Slate800,
                            disabledContentColor = Slate500
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        if (uiState.isClocking) {
                            CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        } else {
                            Icon(
                                imageVector = if (!isCheckedIn) Icons.Default.Login else Icons.Default.Logout,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = when {
                                    !isCheckedIn -> "Clock In (GPS & Wi-Fi)"
                                    !isCheckedOut -> "Clock Out"
                                    else -> "Shift Complete"
                                },
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Quick Stats Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Present",
                    value = "${uiState.summary?.present ?: 0} Days",
                    icon = Icons.Default.CheckCircle,
                    iconTint = Emerald400,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Late",
                    value = "${uiState.summary?.late ?: 0} Days",
                    icon = Icons.Default.Schedule,
                    iconTint = Amber400,
                    modifier = Modifier.weight(1f)
                )
            }

            // Quick Actions Section Title
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = Slate50
                )
            )

            // Quick Actions Grid (3 Columns)
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionTile(
                        title = "Attendance",
                        icon = Icons.Default.Fingerprint,
                        tint = Emerald400,
                        onClick = { onNavigate(Screen.Attendance.route) },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionTile(
                        title = "Leave",
                        icon = Icons.Default.CalendarToday,
                        tint = Cyan400,
                        onClick = { onNavigate(Screen.Leave.route) },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionTile(
                        title = "Payroll",
                        icon = Icons.Default.Payments,
                        tint = Amber400,
                        onClick = { onNavigate(Screen.Payroll.route) },
                        modifier = Modifier.weight(1f)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionTile(
                        title = "Tasks",
                        icon = Icons.Default.Checklist,
                        tint = Indigo500,
                        onClick = { onNavigate(Screen.Tasks.route) },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionTile(
                        title = "Notices",
                        icon = Icons.Default.Campaign,
                        tint = Purple500,
                        onClick = { onNavigate(Screen.Announcements.route) },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionTile(
                        title = "Profile",
                        icon = Icons.Default.Person,
                        tint = Slate300,
                        onClick = { onNavigate(Screen.Profile.route) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Recent Announcements Preview
            if (uiState.announcements.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Notices",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate50
                        )
                    )
                    Text(
                        text = "View All",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Emerald400,
                            fontWeight = FontWeight.SemiBold
                        ),
                        modifier = Modifier.clickable { onNavigate(Screen.Announcements.route) }
                    )
                }

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    uiState.announcements.forEach { notice ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CardBackground, RoundedCornerShape(12.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                                .clickable { onNavigate(Screen.Announcements.route) }
                                .padding(16.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = notice.title,
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Slate50
                                        )
                                    )
                                    StatusBadge(status = notice.type ?: "INFO")
                                }
                                Text(
                                    text = notice.content,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = Slate400,
                                        fontSize = 12.sp
                                    ),
                                    maxLines = 2
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun QuickActionTile(
    title: String,
    icon: ImageVector,
    tint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .aspectRatio(1f)
            .background(CardBackground, RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(tint.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = tint,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = Slate300
                )
            )
        }
    }
}
