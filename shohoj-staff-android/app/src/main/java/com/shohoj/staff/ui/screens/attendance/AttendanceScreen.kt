package com.shohoj.staff.ui.screens.attendance

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils

@Composable
fun AttendanceScreen(
    onNavigate: (String) -> Unit,
    viewModel: AttendanceViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    val today = uiState.today
    val isCheckedIn = today?.checkInTime != null || today?.checkIn != null
    val isCheckedOut = today?.checkOutTime != null || today?.checkOut != null

    val dutySchedule = uiState.dutySchedule ?: today?.dutySchedule
    val dutyStartTime = dutySchedule?.startTime ?: "09:00"
    val dutyEndTime = dutySchedule?.endTime ?: "20:00"
    val isNightShift = dutySchedule?.nightShift == true
    val isCheckOutVisible = DateUtils.isCheckOutVisible(dutyEndTime, isNightShift)
    val checkOutOpenTime = DateUtils.getCheckOutOpenTimeString(dutyEndTime)
    val formattedDutyEnd = DateUtils.getDutyEndTimeString(dutyEndTime)

    val isLunchBreakVisible = DateUtils.isLunchBreakVisible(dutyStartTime, dutyEndTime, isNightShift)
    val lunchStartTime = DateUtils.getLunchTimeString(dutyStartTime, dutyEndTime, isNightShift)
    val lunchAvailableTime = DateUtils.getLunchAvailableTimeString(dutyStartTime, dutyEndTime, isNightShift)

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "Attendance",
                subtitle = "Clock-in, breaks & monthly logs"
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Attendance.route,
                onNavigate = onNavigate
            )
        },
        containerColor = Slate950
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Live Punch & Break Card
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(CardBackground, RoundedCornerShape(18.dp))
                        .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
                        .padding(20.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Punch In / Out & Break",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                            )
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if ((today?.lateMinutes ?: 0) > 0) {
                                    Text(
                                        text = "+${today?.lateMinutes}m late",
                                        color = Amber500,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                StatusBadge(
                                    status = when {
                                        uiState.activeBreak != null -> "ON BREAK"
                                        today?.isLate == true || (today?.lateMinutes ?: 0) > 0 -> "LATE"
                                        isCheckedOut -> "CLOCKED OUT"
                                        isCheckedIn -> "CLOCKED IN"
                                        else -> "NOT CLOCKED IN"
                                    }
                                )
                            }
                        }

                        // GPS & Wi-Fi environment info
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.LocationOn, contentDescription = null, tint = Emerald400, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = uiState.currentLocationString,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp, color = Slate400),
                                    maxLines = 1
                                )
                            }
                            Row(
                                modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Wifi, contentDescription = null, tint = Cyan400, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = uiState.currentWifiString,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp, color = Slate400),
                                    maxLines = 1
                                )
                            }
                        }

                        Divider(color = Slate700, thickness = 0.5.dp)

                        // 1. Not Clocked In -> Show Clock In Button
                        if (!isCheckedIn) {
                            Button(
                                onClick = { viewModel.clockAction("CLOCK_IN") },
                                enabled = !uiState.isActionLoading,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Emerald500,
                                    contentColor = Slate950,
                                    disabledContainerColor = Slate800,
                                    disabledContentColor = Slate500
                                ),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.fillMaxWidth().height(46.dp)
                            ) {
                                Icon(Icons.Default.Login, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Clock In", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        } else if (!isCheckedOut) {
                            // 2. Clocked In -> Handle Active Break, Lunch Break Button, and Clock Out Button

                            // A. Active Break Live Display
                            if (uiState.activeBreak != null) {
                                val statusColor = when (uiState.activeBreakStatusColor) {
                                    "ROSE" -> Rose500
                                    "AMBER" -> Amber500
                                    else -> Emerald400
                                }

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(
                                            brush = Brush.linearGradient(
                                                listOf(
                                                    when (uiState.activeBreakStatusColor) {
                                                        "ROSE" -> Color(0xFF3B1219)
                                                        "AMBER" -> Color(0xFF3B280A)
                                                        else -> Color(0xFF063023)
                                                    },
                                                    Slate900
                                                )
                                            ),
                                            shape = RoundedCornerShape(14.dp)
                                        )
                                        .border(1.5.dp, statusColor.copy(alpha = 0.6f), RoundedCornerShape(14.dp))
                                        .padding(14.dp)
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Icon(Icons.Default.Restaurant, contentDescription = null, tint = statusColor, modifier = Modifier.size(18.dp))
                                                Text(
                                                    text = uiState.activeBreak?.type ?: "Lunch Break",
                                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50, fontSize = 14.sp)
                                                )
                                            }
                                            Surface(
                                                color = statusColor.copy(alpha = 0.2f),
                                                shape = RoundedCornerShape(6.dp),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.4f))
                                            ) {
                                                Text(
                                                    text = uiState.activeBreakStatusText.ifEmpty { "ACTIVE" },
                                                    color = statusColor,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                                )
                                            }
                                        }

                                        Column(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text(
                                                text = uiState.activeBreakCountdown.ifEmpty { "00:00" },
                                                style = MaterialTheme.typography.headlineLarge.copy(
                                                    fontSize = 32.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    letterSpacing = 2.sp,
                                                    color = if (uiState.activeBreakStatusColor == "ROSE") Rose400 else Slate50
                                                )
                                            )
                                            Text(
                                                text = if (uiState.activeBreakStatusColor == "ROSE") "Break Overstay" else "Break Time Remaining",
                                                color = Slate400,
                                                fontSize = 11.sp
                                            )
                                        }

                                        if (uiState.activeBreakFineText != null) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .background(statusColor.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                                    .border(1.dp, statusColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                                    .padding(vertical = 4.dp, horizontal = 8.dp)
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Icon(Icons.Default.WarningAmber, contentDescription = null, tint = statusColor, modifier = Modifier.size(14.dp))
                                                    Text(
                                                        text = uiState.activeBreakFineText!!,
                                                        color = statusColor,
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.SemiBold
                                                    )
                                                }
                                            }
                                        }

                                        Button(
                                            onClick = { viewModel.endActiveBreak() },
                                            enabled = !uiState.isEndingBreak,
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (uiState.activeBreakStatusColor == "ROSE") Rose500 else Emerald500,
                                                contentColor = Slate950
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            modifier = Modifier.fillMaxWidth().height(42.dp)
                                        ) {
                                            if (uiState.isEndingBreak) {
                                                CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                                            } else {
                                                Icon(Icons.Default.StopCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("End Break Now", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                            }
                                        }
                                    }
                                }
                            } else {
                                // B. No active break -> Check lunch break window (15 mins prior)
                                if (isLunchBreakVisible) {
                                    Button(
                                        onClick = { viewModel.requestLunchBreak() },
                                        enabled = !uiState.isStartingBreak && !uiState.isActionLoading,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Amber500,
                                            contentColor = Slate950,
                                            disabledContainerColor = Slate800,
                                            disabledContentColor = Slate500
                                        ),
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth().height(46.dp)
                                    ) {
                                        if (uiState.isStartingBreak) {
                                            CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                        } else {
                                            Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Start Lunch Break", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        }
                                    }
                                } else {
                                    // Notice before lunch window opens
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Slate800.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                            .border(1.dp, Amber500.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                                            .padding(12.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .background(Amber500.copy(alpha = 0.15f), RoundedCornerShape(8.dp)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.Restaurant,
                                                    contentDescription = null,
                                                    tint = Amber400,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = "Lunch Break opens at $lunchAvailableTime",
                                                    style = MaterialTheme.typography.bodyMedium.copy(
                                                        color = Slate50,
                                                        fontWeight = FontWeight.SemiBold,
                                                        fontSize = 13.sp
                                                    )
                                                )
                                                Text(
                                                    text = "Available 15 min before $lunchStartTime lunch time",
                                                    style = MaterialTheme.typography.bodySmall.copy(
                                                        color = Slate400,
                                                        fontSize = 11.sp
                                                    )
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            // C. Check Out Button or Availability Notice
                            if (isCheckOutVisible) {
                                Button(
                                    onClick = { viewModel.clockAction("CLOCK_OUT") },
                                    enabled = !uiState.isActionLoading && uiState.activeBreak == null,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Rose500,
                                        contentColor = Slate50,
                                        disabledContainerColor = Slate800,
                                        disabledContentColor = Slate500
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth().height(46.dp)
                                ) {
                                    Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Clock Out", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Slate800.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                        .border(1.dp, Slate700, RoundedCornerShape(10.dp))
                                        .padding(12.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(32.dp)
                                                .background(Slate700.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Schedule,
                                                contentDescription = null,
                                                tint = Slate400,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "Check-out opens at $checkOutOpenTime",
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    color = Slate100,
                                                    fontWeight = FontWeight.SemiBold,
                                                    fontSize = 13.sp
                                                )
                                            )
                                            Text(
                                                text = "Opens 1h before duty ends ($formattedDutyEnd)",
                                                style = MaterialTheme.typography.bodySmall.copy(
                                                    color = Slate400,
                                                    fontSize = 11.sp
                                                )
                                            )
                                        }
                                    }
                                }
                            }
                        } else {
                            // 3. Clocked Out for today
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Slate800, RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald400, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(text = "Shift Completed for Today", color = Slate200, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                }
                            }
                        }

                        if (uiState.isActionLoading) {
                            LinearProgressIndicator(color = Emerald500, modifier = Modifier.fillMaxWidth())
                        }
                    }
                }
            }

            // Feedback messages
            if (uiState.successMessage != null) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Emerald500.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                            .border(1.dp, Emerald500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Text(text = uiState.successMessage!!, color = Emerald400, fontSize = 13.sp)
                    }
                }
            }

            if (uiState.error != null) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Rose500.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                            .border(1.dp, Rose500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Text(text = uiState.error!!, color = Rose400, fontSize = 13.sp)
                    }
                }
            }

            // Attendance KPI Summary Row
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Monthly Overview",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MetricCard(
                            title = "Present",
                            value = "${uiState.summary.present}",
                            icon = Icons.Default.CheckCircle,
                            iconTint = Emerald400,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Late",
                            value = "${uiState.summary.late}",
                            icon = Icons.Default.Schedule,
                            iconTint = Amber400,
                            modifier = Modifier.weight(1f)
                        )
                        MetricCard(
                            title = "Absent",
                            value = "${uiState.summary.absent}",
                            icon = Icons.Default.Cancel,
                            iconTint = Rose400,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // History Records Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Attendance History",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                    )
                    IconButton(onClick = { viewModel.refreshData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Slate400)
                    }
                }
            }

            // Records List
            if (uiState.records.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyStateView(
                        title = "No Attendance Records",
                        description = "Attendance logs will appear here once you clock in."
                    )
                }
            } else {
                items(uiState.records) { record ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CardBackground, RoundedCornerShape(14.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                            .padding(16.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = DateUtils.formatDate(record.date ?: record.checkInTime),
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Slate50
                                    )
                                )
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if ((record.lateMinutes ?: 0) > 0) {
                                        Text(
                                            text = "+${record.lateMinutes}m late",
                                            color = Amber500,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    StatusBadge(status = record.effectiveStatus)
                                }
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(text = "Check In", style = MaterialTheme.typography.labelSmall.copy(color = Slate500))
                                    Text(
                                        text = DateUtils.formatTime(record.displayCheckIn),
                                        style = MaterialTheme.typography.bodyMedium.copy(color = Slate300, fontWeight = FontWeight.Medium)
                                    )
                                }

                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(text = "Check Out", style = MaterialTheme.typography.labelSmall.copy(color = Slate500))
                                    Text(
                                        text = DateUtils.formatTime(record.displayCheckOut),
                                        style = MaterialTheme.typography.bodyMedium.copy(color = Slate300, fontWeight = FontWeight.Medium)
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(text = "Work Duration", style = MaterialTheme.typography.labelSmall.copy(color = Slate500))
                                    Text(
                                        text = DateUtils.formatMinutesToHours(record.totalWorkingMinutes),
                                        style = MaterialTheme.typography.bodyMedium.copy(color = Emerald400, fontWeight = FontWeight.SemiBold)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
