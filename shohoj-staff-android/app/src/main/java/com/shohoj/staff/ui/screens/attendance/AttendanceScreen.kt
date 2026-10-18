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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AttendanceScreen(
    onNavigate: (String) -> Unit,
    viewModel: AttendanceViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val todayDateKey = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }
    var selectedCalendarDate by remember { mutableStateOf<String?>(todayDateKey) }

    val filteredRecords = remember(uiState.records, selectedCalendarDate) {
        if (selectedCalendarDate == null) {
            uiState.records
        } else {
            uiState.records.filter { r ->
                val rKey = DateUtils.extractDateKey(r.date ?: r.checkInTime)
                rKey == selectedCalendarDate
            }
        }
    }

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

                                        if (uiState.activeBreak?.isPaused == true) {
                                            Button(
                                                onClick = { viewModel.resumeBreak() },
                                                enabled = !uiState.isStartingBreak,
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Color.Transparent,
                                                    contentColor = Slate950
                                                ),
                                                shape = RoundedCornerShape(14.dp),
                                                contentPadding = PaddingValues(),
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(48.dp)
                                                    .background(
                                                        brush = Brush.horizontalGradient(
                                                            colors = listOf(Color(0xFF10B981), Color(0xFF047857))
                                                        ),
                                                        shape = RoundedCornerShape(14.dp)
                                                    )
                                                    .border(
                                                        width = 1.dp,
                                                        color = Color(0xFF6EE7B7).copy(alpha = 0.5f),
                                                        shape = RoundedCornerShape(14.dp)
                                                    )
                                            ) {
                                                if (uiState.isStartingBreak) {
                                                    CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                                } else {
                                                    Icon(
                                                        imageVector = Icons.Default.PlayArrow,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(20.dp),
                                                        tint = Slate950
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = "Resume Break",
                                                        fontWeight = FontWeight.ExtraBold,
                                                        fontSize = 14.sp,
                                                        color = Slate950,
                                                        letterSpacing = 0.5.sp,
                                                        maxLines = 1
                                                    )
                                                }
                                            }
                                        } else {
                                            Button(
                                                onClick = { viewModel.pauseBreak() },
                                                enabled = !uiState.isStartingBreak,
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Color.Transparent,
                                                    contentColor = Slate950
                                                ),
                                                shape = RoundedCornerShape(14.dp),
                                                contentPadding = PaddingValues(),
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(48.dp)
                                                    .background(
                                                        brush = Brush.horizontalGradient(
                                                            colors = listOf(Color(0xFFF59E0B), Color(0xFFD97706))
                                                        ),
                                                        shape = RoundedCornerShape(14.dp)
                                                    )
                                                    .border(
                                                        width = 1.dp,
                                                        color = Color(0xFFFCD34D).copy(alpha = 0.5f),
                                                        shape = RoundedCornerShape(14.dp)
                                                    )
                                            ) {
                                                if (uiState.isStartingBreak) {
                                                    CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                                } else {
                                                    Icon(
                                                        imageVector = Icons.Default.Pause,
                                                        contentDescription = null,
                                                        modifier = Modifier.size(20.dp),
                                                        tint = Slate950
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = "Pause Break",
                                                        fontWeight = FontWeight.ExtraBold,
                                                        fontSize = 14.sp,
                                                        color = Slate950,
                                                        letterSpacing = 0.5.sp,
                                                        maxLines = 1
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                // Dedicated Lunch Break Action (Clickable at Any Time during Shift)
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Slate800.copy(alpha = 0.65f), RoundedCornerShape(14.dp))
                                        .border(1.dp, Amber500.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                                        .padding(14.dp)
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                                            ) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .background(Amber500.copy(alpha = 0.15f), CircleShape),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.Restaurant,
                                                        contentDescription = null,
                                                        tint = Amber400,
                                                        modifier = Modifier.size(20.dp)
                                                    )
                                                }
                                                Column {
                                                    Text(
                                                        text = "Dedicated Lunch Break",
                                                        style = MaterialTheme.typography.titleMedium.copy(
                                                            fontWeight = FontWeight.Bold,
                                                            color = Slate50,
                                                            fontSize = 14.sp
                                                        )
                                                    )
                                                    Text(
                                                        text = "Set Allowance: ${dutySchedule?.breakTime ?: 60}m (+${dutySchedule?.gracePeriod ?: 15}m grace)",
                                                        style = MaterialTheme.typography.bodySmall.copy(
                                                            color = Slate400,
                                                            fontSize = 11.sp
                                                        )
                                                    )
                                                }
                                            }
                                            Surface(
                                                color = Emerald500.copy(alpha = 0.15f),
                                                shape = RoundedCornerShape(6.dp),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Emerald500.copy(alpha = 0.3f))
                                            ) {
                                                Text(
                                                    text = "ANY TIME",
                                                    color = Emerald400,
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                )
                                            }
                                        }

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
                                            modifier = Modifier.fillMaxWidth().height(44.dp)
                                        ) {
                                            if (uiState.isStartingBreak) {
                                                CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                            } else {
                                                Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(18.dp))
                                                Spacer(modifier = Modifier.width(6.dp))
                                                Text("Start Lunch Break", fontWeight = FontWeight.Bold, fontSize = 13.sp)
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

            // Horizontal Calendar View
            item {
                HorizontalCalendarView(
                    records = uiState.records,
                    selectedDate = selectedCalendarDate,
                    onDateSelected = { dateKey ->
                        selectedCalendarDate = if (selectedCalendarDate == dateKey) null else dateKey
                    }
                )
            }

            // History Records Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val isToday = selectedCalendarDate == todayDateKey
                        Text(
                            text = when {
                                isToday -> "Today's Logs"
                                selectedCalendarDate != null -> "Logs for $selectedCalendarDate"
                                else -> "Attendance History"
                            },
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                        )
                        if (selectedCalendarDate != null) {
                            TextButton(
                                onClick = { selectedCalendarDate = null },
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp),
                                modifier = Modifier.height(26.dp)
                            ) {
                                Text(
                                    text = "Show All Logs",
                                    color = Emerald400,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                    IconButton(onClick = { viewModel.refreshData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Slate400)
                    }
                }
            }

            // Records List
            if (filteredRecords.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyStateView(
                        title = if (selectedCalendarDate != null) "No Record for $selectedCalendarDate" else "No Attendance Records",
                        description = if (selectedCalendarDate != null) "No attendance activity was logged on this date." else "Attendance logs will appear here once you clock in."
                    )
                }
            } else {
                items(filteredRecords) { record ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CardBackground, RoundedCornerShape(14.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                            .padding(14.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            // Header: Date & Status Badge
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .background(Color(0xFF1E293B), RoundedCornerShape(7.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.DateRange,
                                            contentDescription = null,
                                            tint = Slate400,
                                            modifier = Modifier.size(15.dp)
                                        )
                                    }
                                    Text(
                                        text = DateUtils.formatDate(record.date ?: record.checkInTime),
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Slate50
                                        )
                                    )
                                }

                                StatusBadge(status = record.effectiveStatus)
                            }

                            HorizontalDivider(
                                color = CardBorder.copy(alpha = 0.6f),
                                thickness = 1.dp
                            )

                            // Vertical mode entries
                            Column(verticalArrangement = Arrangement.spacedBy(7.dp)) {
                                // 1. Check In
                                AttendanceVerticalRow(
                                    icon = Icons.Default.Login,
                                    iconTint = Emerald400,
                                    iconBg = Emerald400.copy(alpha = 0.12f),
                                    label = "Check In",
                                    value = DateUtils.formatTime(record.displayCheckIn),
                                    valueColor = if (record.displayCheckIn != null) Slate100 else Slate500
                                )

                                // 2. Check Out
                                val hasCheckedOut = record.displayCheckOut != null
                                AttendanceVerticalRow(
                                    icon = Icons.Default.Logout,
                                    iconTint = if (hasCheckedOut) Rose400 else Slate500,
                                    iconBg = if (hasCheckedOut) Rose400.copy(alpha = 0.12f) else Slate500.copy(alpha = 0.10f),
                                    label = "Check Out",
                                    value = DateUtils.formatTime(record.displayCheckOut),
                                    valueColor = if (hasCheckedOut) Slate100 else Slate500
                                )

                                // 3. Lunch Break
                                val lunchVal = record.displayLunchBreak
                                val hasLunch = lunchVal != "--:--"
                                AttendanceVerticalRow(
                                    icon = Icons.Default.Restaurant,
                                    iconTint = Amber400,
                                    iconBg = Amber400.copy(alpha = 0.12f),
                                    label = "Lunch Break",
                                    value = lunchVal,
                                    valueColor = if (hasLunch) Amber400 else Slate500
                                )

                                // 4. Late Time
                                val isLate = (record.lateMinutes ?: 0) > 0
                                AttendanceVerticalRow(
                                    icon = Icons.Default.Schedule,
                                    iconTint = if (isLate) Amber500 else Emerald400,
                                    iconBg = if (isLate) Amber500.copy(alpha = 0.14f) else Emerald400.copy(alpha = 0.12f),
                                    label = "Late Time",
                                    value = record.displayLateTime,
                                    valueColor = if (isLate) Amber500 else Emerald400,
                                    isHighlight = isLate
                                )

                                // 5. Work Duration
                                AttendanceVerticalRow(
                                    icon = Icons.Default.Timer,
                                    iconTint = Emerald400,
                                    iconBg = Emerald400.copy(alpha = 0.12f),
                                    label = "Work Duration",
                                    value = DateUtils.formatMinutesToHours(record.totalWorkingMinutes),
                                    valueColor = Emerald400
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AttendanceVerticalRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    iconBg: Color,
    label: String,
    value: String,
    valueColor: Color,
    isHighlight: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0F172A).copy(alpha = 0.45f), RoundedCornerShape(9.dp))
            .border(0.5.dp, CardBorder.copy(alpha = 0.5f), RoundedCornerShape(9.dp))
            .padding(horizontal = 10.dp, vertical = 7.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(iconBg, RoundedCornerShape(6.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(13.dp)
                )
            }
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Slate400,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Normal
                )
            )
        }

        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = valueColor,
                fontSize = 12.sp,
                fontWeight = if (isHighlight) FontWeight.Bold else FontWeight.SemiBold
            )
        )
    }
}
