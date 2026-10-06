package com.shohoj.staff.ui.screens.home

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.BackgroundPermissionHelper
import com.shohoj.staff.util.DateUtils

@Composable
fun HomeScreen(
    onNavigate: (String) -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    var isBatteryIgnored by remember { mutableStateOf(BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)) }
    var isBgBannerDismissed by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        isBatteryIgnored = BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)
    }

    val today = uiState.todayAttendance
    val isCheckedIn = today?.checkInTime != null || today?.checkIn != null
    val isCheckedOut = today?.checkOutTime != null || today?.checkOut != null

    val dutySchedule = uiState.dutySchedule ?: today?.dutySchedule ?: uiState.employee?.dutySchedule
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

            // Active Live Short Break Countdown Banner
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
                            shape = RoundedCornerShape(18.dp)
                        )
                        .border(1.5.dp, statusColor.copy(alpha = 0.6f), RoundedCornerShape(18.dp))
                        .padding(18.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    Icons.Default.Timer,
                                    contentDescription = null,
                                    tint = statusColor,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = uiState.activeBreak?.type ?: "Active Short Break",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Slate50
                                    )
                                )
                            }
                            Surface(
                                color = statusColor.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, statusColor.copy(alpha = 0.4f))
                            ) {
                                Text(
                                    text = uiState.activeBreakStatusText.ifEmpty { "ACTIVE" },
                                    color = statusColor,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
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
                                    fontSize = 38.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 2.sp,
                                    color = if (uiState.activeBreakStatusColor == "ROSE") Rose400 else Slate50
                                )
                            )
                            Text(
                                text = if (uiState.activeBreakStatusColor == "ROSE") "Overstay Countdown" else "Time Remaining",
                                color = Slate400,
                                fontSize = 11.sp
                            )
                        }

                        if (uiState.activeBreakFineText != null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(statusColor.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                    .border(1.dp, statusColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                    .padding(vertical = 6.dp, horizontal = 10.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.WarningAmber, contentDescription = null, tint = statusColor, modifier = Modifier.size(15.dp))
                                    Text(
                                        text = uiState.activeBreakFineText!!,
                                        color = statusColor,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        if (uiState.activeBreak?.isPaused == true) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = { viewModel.resumeBreak() },
                                    enabled = !uiState.isStartingBreak && !uiState.isEndingBreak,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Emerald500,
                                        contentColor = Slate950
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                ) {
                                    if (uiState.isStartingBreak) {
                                        CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                                    } else {
                                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Resume Break", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }

                                Button(
                                    onClick = { viewModel.endActiveBreak() },
                                    enabled = !uiState.isEndingBreak && !uiState.isStartingBreak,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Rose500,
                                        contentColor = Slate50
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                ) {
                                    if (uiState.isEndingBreak) {
                                        CircularProgressIndicator(color = Slate50, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                                    } else {
                                        Icon(Icons.Default.StopCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("End Break", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = { viewModel.pauseBreak() },
                                    enabled = !uiState.isStartingBreak && !uiState.isEndingBreak,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Amber500,
                                        contentColor = Slate950
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                ) {
                                    if (uiState.isStartingBreak) {
                                        CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                                    } else {
                                        Icon(Icons.Default.Pause, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Pause Break", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }

                                Button(
                                    onClick = { viewModel.endActiveBreak() },
                                    enabled = !uiState.isEndingBreak && !uiState.isStartingBreak,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (uiState.activeBreakStatusColor == "ROSE") Rose500 else Slate800,
                                        contentColor = Slate50
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(44.dp)
                                ) {
                                    if (uiState.isEndingBreak) {
                                        CircularProgressIndicator(color = Slate50, strokeWidth = 2.dp, modifier = Modifier.size(16.dp))
                                    } else {
                                        Icon(Icons.Default.StopCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("End Break Now", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
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

            // Background Running Optimization Alert Banner (if not unrestricted)
            if (!isBatteryIgnored && !isBgBannerDismissed) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Amber500.copy(alpha = 0.12f), shape = RoundedCornerShape(12.dp))
                        .border(1.dp, Amber500.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, tint = Amber400, modifier = Modifier.size(18.dp))
                            Column {
                                Text(
                                    text = "Background alerts restricted",
                                    style = MaterialTheme.typography.bodyMedium.copy(color = Slate100, fontWeight = FontWeight.SemiBold, fontSize = 12.5.sp)
                                )
                                Text(
                                    text = "Enable unrestricted running for instant task pings",
                                    style = MaterialTheme.typography.bodySmall.copy(color = Slate400, fontSize = 11.sp)
                                )
                            }
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Amber500,
                                modifier = Modifier.clickable {
                                    BackgroundPermissionHelper.requestIgnoreBatteryOptimization(context)
                                    isBatteryIgnored = BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)
                                }
                            ) {
                                Text(
                                    text = "Fix",
                                    color = Slate950,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                            IconButton(
                                onClick = { isBgBannerDismissed = true },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = Slate400, modifier = Modifier.size(14.dp))
                            }
                        }
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

                    // Action Button / Pending State
                    when {
                        !isCheckedIn -> {
                            Button(
                                onClick = { viewModel.performQuickClockAction() },
                                enabled = !uiState.isClocking,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Emerald500,
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
                                    Icon(Icons.Default.Login, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(text = "Clock In (GPS & Wi-Fi)", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        !isCheckedOut -> {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                // Dedicated Lunch Break Action (Clickable at Any Time during Shift)
                                if (uiState.activeBreak == null) {
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
                                                enabled = !uiState.isStartingBreak && !uiState.isClocking,
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Amber500,
                                                    contentColor = Slate950,
                                                    disabledContainerColor = Slate800,
                                                    disabledContentColor = Slate500
                                                ),
                                                shape = RoundedCornerShape(10.dp),
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .height(44.dp)
                                            ) {
                                                if (uiState.isStartingBreak) {
                                                    CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                                } else {
                                                    Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(18.dp))
                                                    Spacer(modifier = Modifier.width(8.dp))
                                                    Text(text = "Start Lunch Break", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                                }
                                            }
                                        }
                                    }
                                }

                                // Check Out Action / Availability Notice
                                if (isCheckOutVisible) {
                                    Button(
                                        onClick = { viewModel.performQuickClockAction() },
                                        enabled = !uiState.isClocking && uiState.activeBreak == null,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Rose500,
                                            contentColor = Slate50,
                                            disabledContainerColor = Slate800,
                                            disabledContentColor = Slate500
                                        ),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(48.dp)
                                    ) {
                                        if (uiState.isClocking) {
                                            CircularProgressIndicator(color = Slate50, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                                        } else {
                                            Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(text = "Clock Out", fontWeight = FontWeight.Bold)
                                        }
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(Slate800.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                                            .border(1.dp, Slate700, RoundedCornerShape(12.dp))
                                            .padding(12.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(32.dp)
                                                    .background(Slate700.copy(alpha = 0.3f), CircleShape),
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
                                                    text = "Available 1h before duty ends ($formattedDutyEnd)",
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
                        }
                        else -> {
                            Button(
                                onClick = {},
                                enabled = false,
                                colors = ButtonDefaults.buttonColors(
                                    disabledContainerColor = Slate800,
                                    disabledContentColor = Slate500
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(text = "Shift Complete", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // 📅 Duty Schedule & Assigned Roster Card
            val isRosterDuty = dutySchedule?.isRoster == true || uiState.todayRoster != null
            val isCustomDuty = dutySchedule?.isCustom == true || uiState.customDuty != null
            val shiftCardGradient = when {
                isRosterDuty -> listOf(Color(0xFF064E3B), Color(0xFF0F172A))
                isCustomDuty -> listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                else -> listOf(Color(0xFF1E293B), Color(0xFF0F172A))
            }
            val shiftBorderColor = when {
                isRosterDuty -> Emerald500.copy(alpha = 0.5f)
                isCustomDuty -> Amber500.copy(alpha = 0.4f)
                else -> CardBorder
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(brush = Brush.linearGradient(shiftCardGradient), shape = RoundedCornerShape(18.dp))
                    .border(1.dp, shiftBorderColor, RoundedCornerShape(18.dp))
                    .padding(20.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = if (isRosterDuty) Icons.Default.EventNote else if (isCustomDuty) Icons.Default.Bolt else Icons.Default.Schedule,
                                contentDescription = null,
                                tint = if (isRosterDuty) Emerald400 else if (isCustomDuty) Amber400 else Slate400,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "My Duty Schedule",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate50
                                )
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = if (isRosterDuty) Emerald500.copy(alpha = 0.2f) else if (isCustomDuty) Amber500.copy(alpha = 0.2f) else Slate800,
                            border = BorderStroke(1.dp, if (isRosterDuty) Emerald500 else if (isCustomDuty) Amber500 else Slate700)
                        ) {
                            Text(
                                text = when {
                                    isRosterDuty -> "📅 Roster Active"
                                    isCustomDuty -> "⚡ Custom Duty"
                                    else -> "Standard Shift"
                                },
                                color = if (isRosterDuty) Emerald400 else if (isCustomDuty) Amber400 else Slate300,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    // Shift Timings & Shift Name
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        val shiftDisplayName = dutySchedule?.name ?: if (isRosterDuty) "Assigned Duty Roster" else if (isCustomDuty) "Custom Duty Shift" else "Standard Company Shift"
                        Text(
                            text = shiftDisplayName,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = if (isRosterDuty) Emerald400 else if (isCustomDuty) Amber400 else Slate400,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 12.sp
                            )
                        )
                        Text(
                            text = "$dutyStartTime — $dutyEndTime",
                            style = MaterialTheme.typography.headlineSmall.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = Slate50,
                                fontSize = 22.sp,
                                letterSpacing = 0.5.sp
                            )
                        )
                        if (!dutySchedule?.rosterNote.isNullOrBlank()) {
                            Text(
                                text = "Note: ${dutySchedule?.rosterNote}",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Emerald300,
                                    fontSize = 11.5.sp
                                )
                            )
                        }
                    }

                    // Duty Badges (Grace Period, Break, Night Shift)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Slate800.copy(alpha = 0.6f),
                            border = BorderStroke(0.5.dp, Slate700),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("Grace Period", color = Slate400, fontSize = 10.sp)
                                Text("+${dutySchedule?.gracePeriod ?: 15}m", color = Amber400, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Slate800.copy(alpha = 0.6f),
                            border = BorderStroke(0.5.dp, Slate700),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(
                                modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("Lunch Break", color = Slate400, fontSize = 10.sp)
                                Text("${dutySchedule?.breakTime ?: 60}m", color = Emerald400, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (isNightShift) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFF3B1D54),
                                border = BorderStroke(0.5.dp, Color(0xFF9333EA)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    modifier = Modifier.padding(vertical = 8.dp, horizontal = 10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text("Shift Type", color = Color(0xFFD8B4FE), fontSize = 10.sp)
                                    Text("Night", color = Color(0xFFC084FC), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Upcoming Assigned Roster Dates List (if any)
                    if (uiState.dutyRosters.isNotEmpty()) {
                        Divider(color = Slate800, thickness = 1.dp)
                        Text(
                            text = "Assigned Roster Schedule (${uiState.dutyRosters.size} Days)",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate300,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            uiState.dutyRosters.take(5).forEach { r ->
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (r.isToday == true) Emerald500.copy(alpha = 0.12f) else Slate800.copy(alpha = 0.4f),
                                    border = BorderStroke(1.dp, if (r.isToday == true) Emerald500.copy(alpha = 0.4f) else Slate700.copy(alpha = 0.4f)),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text(
                                                    text = r.dateFormatted ?: r.date,
                                                    color = Slate100,
                                                    fontSize = 12.5.sp,
                                                    fontWeight = FontWeight.SemiBold
                                                )
                                                if (r.isToday == true) {
                                                    Surface(
                                                        shape = RoundedCornerShape(4.dp),
                                                        color = Emerald500,
                                                    ) {
                                                        Text("TODAY", color = Slate950, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                                                    }
                                                }
                                            }
                                            if (!r.note.isNullOrBlank()) {
                                                Text(
                                                    text = r.note,
                                                    color = Slate400,
                                                    fontSize = 11.sp
                                                )
                                            }
                                        }

                                        Column(horizontalAlignment = Alignment.End) {
                                            Text(
                                                text = if (!r.startTime.isNullOrBlank() && !r.endTime.isNullOrBlank()) "${r.startTime} - ${r.endTime}" else (r.shiftName ?: "Assigned"),
                                                color = if (r.isToday == true) Emerald400 else Slate200,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            if (!r.shiftName.isNullOrBlank()) {
                                                Text(
                                                    text = r.shiftName,
                                                    color = Slate400,
                                                    fontSize = 10.sp
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

            // Dedicated Product Manager Section (Rendered for Product/Production/Inventory Managers)
            val isProductManagerRole = remember(uiState.employee) {
                val des = uiState.employee?.designation?.lowercase() ?: ""
                val dep = uiState.employee?.department?.lowercase() ?: ""
                val role = uiState.employee?.role?.lowercase() ?: ""
                des.contains("product") || des.contains("production") || des.contains("inventory") ||
                des.contains("studio") || des.contains("merchandis") || des.contains("catalog") ||
                des.contains("manager") || des.contains("lead") ||
                dep.contains("product") || dep.contains("production") || dep.contains("inventory") ||
                dep.contains("studio") || dep.contains("merchandis") || dep.contains("operation") ||
                role.contains("product") || role.contains("admin") || role.contains("manager")
            }

            if (isProductManagerRole) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.linearGradient(
                                listOf(
                                    Color(0xFF3B280A),
                                    Slate900
                                )
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .border(1.dp, Amber500.copy(alpha = 0.45f), RoundedCornerShape(16.dp))
                        .clickable { onNavigate(Screen.Products.route) }
                        .padding(16.dp)
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
                                        .size(38.dp)
                                        .background(Amber500.copy(alpha = 0.2f), RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Inventory,
                                        contentDescription = null,
                                        tint = Amber400,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = "Product Manager Section",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = Slate50,
                                            fontSize = 15.sp
                                        )
                                    )
                                    Text(
                                        text = "${uiState.employee?.designation ?: "Product Manager"} • Dedicated Access",
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = Amber400,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium
                                        )
                                    )
                                }
                            }
                            Surface(
                                color = Amber500.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Amber500.copy(alpha = 0.4f))
                            ) {
                                Text(
                                    text = "ACTIVE",
                                    color = Amber400,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        Text(
                            text = "Track studio items, manage client handover returns, inspect shooting inventory, and oversee production workflow stages.",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate300,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onNavigate(Screen.Products.route) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Amber500,
                                    contentColor = Slate950
                                ),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp)
                            ) {
                                Icon(Icons.Default.Inventory2, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(text = "Open Product Manager", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                            IconButton(
                                onClick = {
                                    try {
                                        uriHandler.openUri("https://team.shohojsolution.com/staff")
                                    } catch (e: Exception) {}
                                },
                                modifier = Modifier
                                    .size(44.dp)
                                    .background(Amber500.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Amber500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            ) {
                                Icon(Icons.Default.OpenInBrowser, contentDescription = "Web Portal", tint = Amber400, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }
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
                        title = "Community",
                        icon = Icons.Default.Forum,
                        tint = Emerald400,
                        onClick = { onNavigate(Screen.Community.route) },
                        modifier = Modifier.weight(1f)
                    )
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
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionTile(
                        title = "Products",
                        icon = Icons.Default.Inventory2,
                        tint = Amber400,
                        onClick = { onNavigate(Screen.Products.route) },
                        modifier = Modifier.weight(1f)
                    )
                    QuickActionTile(
                        title = "Profile",
                        icon = Icons.Default.Person,
                        tint = Slate300,
                        onClick = { onNavigate(Screen.Profile.route) },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.weight(1f))
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

        // Automatic In-App Update Dialog on Launch
        uiState.updateDialogInfo?.let { info ->
            AppUpdateDialog(
                updateInfo = info,
                currentVersionName = uiState.appVersionName,
                onDownload = { url ->
                    viewModel.downloadUpdate(url)
                },
                onDismiss = {
                    viewModel.dismissUpdateDialog()
                }
            )
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
