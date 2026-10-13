package com.shohoj.staff.ui.screens.home

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.R
import com.shohoj.staff.data.model.*
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.BackgroundPermissionHelper
import com.shohoj.staff.util.DateUtils
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigate: (String) -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val coroutineScope = rememberCoroutineScope()

    var isBatteryIgnored by remember { mutableStateOf(BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)) }
    var isBgBannerDismissed by remember { mutableStateOf(false) }

    // Tap for Balance revealed animation state
    var isBalanceRevealed by remember { mutableStateOf(false) }

    // Quick Attendance Punch Bottom Sheet
    var showQuickPunchSheet by remember { mutableStateOf(false) }
    var showDutyScheduleSheet by remember { mutableStateOf(false) }

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

    // Dynamic greeting based on current local hour
    val greetingText = remember {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        when (hour) {
            in 5..11 -> "Good Morning"
            in 12..16 -> "Good Afternoon"
            in 17..20 -> "Good Evening"
            else -> "Good Night"
        }
    }

    Scaffold(
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Home.route,
                onNavigate = onNavigate,
                onCenterAction = {
                    showQuickPunchSheet = true
                }
            )
        },
        containerColor = NagadBgWarm
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = padding.calculateBottomPadding())
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
            ) {
                // 1. Scenic Nagad Header with Scenic Illustration & Balance Pill
                ScenicHeaderSection(
                    greeting = greetingText,
                    employeeName = uiState.employee?.displayName ?: "Employee",
                    unreadBadgeCount = (uiState.activeFines.size + uiState.announcements.size).coerceAtLeast(0),
                    isBalanceRevealed = isBalanceRevealed,
                    netSalary = uiState.netSalary,
                    onToggleBalance = {
                        isBalanceRevealed = !isBalanceRevealed
                        if (isBalanceRevealed) {
                            coroutineScope.launch {
                                delay(4500L)
                                isBalanceRevealed = false
                            }
                        }
                    },
                    onNotificationClick = { onNavigate(Screen.Announcements.route) }
                )

                Spacer(modifier = Modifier.height(16.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Success or Error Feedback Banners
                    if (uiState.clockActionSuccessMessage != null) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = Color(0xFFECFDF5),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFA7F3D0))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald600, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = uiState.clockActionSuccessMessage!!,
                                    color = Emerald700,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    if (uiState.error != null) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            color = Color(0xFFFEF2F2),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Color(0xFFFECACA))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Rose500, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = uiState.error!!,
                                    color = Rose500,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }

                    // 2. Nagad 8-Grid Core Actions (4 Columns x 2 Rows)
                    NagadCoreActionsGrid(
                        onAttendanceClick = { onNavigate(Screen.Attendance.route) },
                        onLeaveClick = { onNavigate(Screen.Leave.route) },
                        onTasksClick = { onNavigate(Screen.Tasks.route) },
                        onPayrollClick = { onNavigate(Screen.Payroll.route) },
                        onDutyClick = { showDutyScheduleSheet = true },
                        onBreakClick = {
                            if (uiState.activeBreak != null) {
                                // Break is active
                            } else {
                                viewModel.requestLunchBreak()
                            }
                        },
                        onNoticesClick = { onNavigate(Screen.Announcements.route) },
                        onForumClick = { onNavigate(Screen.Community.route) }
                    )

                    // 3. Nagad Promotional Banner Slider / Notice Carousel
                    NagadPromoBanner(
                        announcements = uiState.announcements,
                        onClick = { onNavigate(Screen.Announcements.route) }
                    )

                    // 4. Active Disciplinary Fine Banner (if any)
                    if (uiState.activeFines.isNotEmpty()) {
                        val totalFineAmount = uiState.activeFines.sumOf { it.amount }
                        val latestFine = uiState.activeFines.first()

                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp))
                                .clickable { onNavigate(Screen.Payroll.route) },
                            shape = RoundedCornerShape(16.dp),
                            color = Color.White,
                            border = BorderStroke(1.2.dp, NagadRed.copy(alpha = 0.5f))
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .background(Color(0xFFFFF1F0), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = NagadRed,
                                        modifier = Modifier.size(26.dp)
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(
                                            text = "DISCIPLINARY PENALTY RECORDED",
                                            style = MaterialTheme.typography.labelSmall.copy(
                                                color = NagadRed,
                                                fontWeight = FontWeight.ExtraBold,
                                                letterSpacing = 0.6.sp,
                                                fontSize = 11.sp
                                            )
                                        )
                                        Surface(
                                            shape = RoundedCornerShape(6.dp),
                                            color = NagadRed
                                        ) {
                                            Text(
                                                text = "-৳${totalFineAmount.toInt()}",
                                                color = Color.White,
                                                fontWeight = FontWeight.ExtraBold,
                                                fontSize = 11.sp,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = latestFine.reason ?: "HR deduction recorded",
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = Slate900,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold
                                        ),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "Tap to review salary deductions & details →",
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = Slate500,
                                            fontSize = 11.sp
                                        )
                                    )
                                }
                            }
                        }
                    }

                    // 5. Active Live Break Banner (if on break)
                    if (uiState.activeBreak != null) {
                        ActiveBreakLiveCard(
                            uiState = uiState,
                            onResumeBreak = { viewModel.resumeBreak() },
                            onPauseBreak = { viewModel.pauseBreak() },
                            onEndBreak = { viewModel.endActiveBreak() }
                        )
                    }

                    // 6. Services Section (Nagad-style Workplace Utilities)
                    Text(
                        text = "Services",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate800,
                            fontSize = 17.sp
                        )
                    )

                    ServicesQuickRow(
                        isCheckedIn = isCheckedIn,
                        isCheckedOut = isCheckedOut,
                        onPunchClick = { showQuickPunchSheet = true },
                        onLunchClick = { viewModel.requestLunchBreak() },
                        onScheduleClick = { showDutyScheduleSheet = true },
                        onProductsClick = { onNavigate(Screen.Products.route) }
                    )

                    // 7. Today's Attendance & Duty Schedule Status
                    TodayDutySummaryCard(
                        today = today,
                        isCheckedIn = isCheckedIn,
                        isCheckedOut = isCheckedOut,
                        dutySchedule = dutySchedule,
                        dutyStartTime = dutyStartTime,
                        dutyEndTime = dutyEndTime,
                        checkOutOpenTime = checkOutOpenTime,
                        isCheckOutVisible = isCheckOutVisible,
                        currentTimeString = uiState.currentTimeString,
                        onOpenPunchSheet = { showQuickPunchSheet = true }
                    )

                    // 8. Background Optimization Fix Banner (if restricted)
                    if (!isBatteryIgnored && !isBgBannerDismissed) {
                        Surface(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            color = Color(0xFFFFFBEB),
                            border = BorderStroke(1.dp, Color(0xFFFDE68A))
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Bolt, contentDescription = null, tint = Amber500, modifier = Modifier.size(22.dp))
                                    Column {
                                        Text(
                                            text = "Background alerts restricted",
                                            style = MaterialTheme.typography.bodyMedium.copy(color = Slate900, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        )
                                        Text(
                                            text = "Enable unrestricted running for instant task pings",
                                            style = MaterialTheme.typography.bodySmall.copy(color = Slate600, fontSize = 11.5.sp)
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
                                            color = Color.White,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                        )
                                    }
                                    IconButton(
                                        onClick = { isBgBannerDismissed = true },
                                        modifier = Modifier.size(24.dp)
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Dismiss", tint = Slate500, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }

            // Quick Attendance Punch Modal Bottom Sheet
            if (showQuickPunchSheet) {
                ModalBottomSheet(
                    onDismissRequest = { showQuickPunchSheet = false },
                    containerColor = Color.White,
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                ) {
                    QuickPunchSheetContent(
                        uiState = uiState,
                        isCheckedIn = isCheckedIn,
                        isCheckedOut = isCheckedOut,
                        isCheckOutVisible = isCheckOutVisible,
                        checkOutOpenTime = checkOutOpenTime,
                        formattedDutyEnd = formattedDutyEnd,
                        onClockAction = {
                            viewModel.performQuickClockAction()
                        },
                        onDismiss = { showQuickPunchSheet = false }
                    )
                }
            }

            // Duty Schedule Roster Bottom Sheet
            if (showDutyScheduleSheet) {
                ModalBottomSheet(
                    onDismissRequest = { showDutyScheduleSheet = false },
                    containerColor = Color.White,
                    shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                ) {
                    DutyScheduleSheetContent(
                        uiState = uiState,
                        dutySchedule = dutySchedule,
                        dutyStartTime = dutyStartTime,
                        dutyEndTime = dutyEndTime,
                        onDismiss = { showDutyScheduleSheet = false }
                    )
                }
            }

            // In-app Update Dialog
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
}

/**
 * Nagad Scenic Header with Watercolor Illustration, Greeting Bar & Tap for Balance Widget
 */
@Composable
private fun ScenicHeaderSection(
    greeting: String,
    employeeName: String,
    unreadBadgeCount: Int,
    isBalanceRevealed: Boolean,
    netSalary: Double?,
    onToggleBalance: () -> Unit,
    onNotificationClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(240.dp)
    ) {
        // Background Watercolor Scenic Illustration
        Image(
            painter = painterResource(id = R.drawable.bg_nagad_scenic),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
        )

        // Subtle gradient fading into warm background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color.Transparent,
                            NagadBgWarm.copy(alpha = 0.5f),
                            NagadBgWarm
                        )
                    )
                )
        )

        // Top Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Greeting & Notification Bell Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Avatar / App Icon in Nagad Coral Circle
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .shadow(elevation = 4.dp, shape = CircleShape)
                            .clip(CircleShape)
                            .background(
                                Brush.radialGradient(
                                    listOf(NagadOrangeLight, NagadOrange, NagadRed)
                                )
                            )
                            .border(2.dp, Color.White, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = employeeName.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 20.sp
                        )
                    }

                    Column {
                        Text(
                            text = greeting,
                            fontSize = 12.5.sp,
                            color = Slate600,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = employeeName,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Slate900,
                            letterSpacing = (-0.3).sp
                        )
                    }
                }

                // Notification Bell with Badge
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .clickable(onClick = onNotificationClick),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Notifications,
                        contentDescription = "Notifications",
                        tint = Slate800,
                        modifier = Modifier.size(28.dp)
                    )

                    if (unreadBadgeCount > 0) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = (-2).dp, y = 2.dp)
                                .size(18.dp)
                                .clip(CircleShape)
                                .background(NagadBadgeRed),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = if (unreadBadgeCount > 9) "9+" else unreadBadgeCount.toString(),
                                color = Color.White,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Floating "Tap for Balance" / "Tap for Net Salary" Pill Capsule Widget
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .shadow(elevation = 6.dp, shape = RoundedCornerShape(28.dp))
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null,
                        onClick = onToggleBalance
                    ),
                color = Color.White,
                shape = RoundedCornerShape(28.dp),
                border = BorderStroke(1.dp, Color(0xFFF1F5F9))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Coral Currency Circle Badge
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(NagadOrange, NagadRed)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "৳",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.width(14.dp))

                    // Animated Text Switcher (Tap for Balance <-> Revealing Net Salary)
                    AnimatedContent(
                        targetState = isBalanceRevealed,
                        transitionSpec = {
                            fadeIn(animationSpec = tween(220)) togetherWith
                                    fadeOut(animationSpec = tween(180))
                        },
                        label = "BalanceRevealAnimation"
                    ) { revealed ->
                        if (revealed) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = if (netSalary != null) "৳ ${String.format("%,.0f", netSalary)}" else "৳ 0.00",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = NagadOrangeDark
                                )
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFFFF3EE)
                                ) {
                                    Text(
                                        text = "Net Salary",
                                        color = NagadOrange,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        } else {
                            Text(
                                text = "Tap for Balance",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Slate700
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Nagad 8-Grid Primary Action Cards (4 columns x 2 rows)
 */
@Composable
private fun NagadCoreActionsGrid(
    onAttendanceClick: () -> Unit,
    onLeaveClick: () -> Unit,
    onTasksClick: () -> Unit,
    onPayrollClick: () -> Unit,
    onDutyClick: () -> Unit,
    onBreakClick: () -> Unit,
    onNoticesClick: () -> Unit,
    onForumClick: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Row 1
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            NagadActionCard(
                title = "Attendance",
                icon = Icons.Outlined.Fingerprint,
                onClick = onAttendanceClick,
                modifier = Modifier.weight(1f)
            )
            NagadActionCard(
                title = "Leave Apply",
                icon = Icons.Outlined.EventAvailable,
                onClick = onLeaveClick,
                modifier = Modifier.weight(1f)
            )
            NagadActionCard(
                title = "My Tasks",
                icon = Icons.Outlined.Checklist,
                onClick = onTasksClick,
                modifier = Modifier.weight(1f)
            )
            NagadActionCard(
                title = "Payslip",
                icon = Icons.Outlined.AccountBalanceWallet,
                onClick = onPayrollClick,
                modifier = Modifier.weight(1f)
            )
        }

        // Row 2
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            NagadActionCard(
                title = "Duty Shift",
                icon = Icons.Outlined.Schedule,
                onClick = onDutyClick,
                modifier = Modifier.weight(1f)
            )
            NagadActionCard(
                title = "Break/Lunch",
                icon = Icons.Outlined.FreeBreakfast,
                onClick = onBreakClick,
                modifier = Modifier.weight(1f)
            )
            NagadActionCard(
                title = "Notices",
                icon = Icons.Outlined.Campaign,
                onClick = onNoticesClick,
                modifier = Modifier.weight(1f)
            )
            NagadActionCard(
                title = "Staff Forum",
                icon = Icons.Outlined.People,
                onClick = onForumClick,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun NagadActionCard(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .height(98.dp)
            .shadow(elevation = 2.dp, shape = RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        color = Color.White,
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.dp, Color(0xFFF1F5F9))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 12.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .background(Color(0xFFFFF4EE), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = NagadOrange,
                    modifier = Modifier.size(24.dp)
                )
            }

            Text(
                text = title,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = Slate800,
                textAlign = TextAlign.Center,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 13.sp
            )
        }
    }
}

/**
 * Promotional Announcement Banner Slider (Nagad Style)
 */
@Composable
private fun NagadPromoBanner(
    announcements: List<AnnouncementItem>,
    onClick: () -> Unit
) {
    val topNotice = announcements.firstOrNull()

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(115.dp)
                .shadow(elevation = 3.dp, shape = RoundedCornerShape(16.dp))
                .clickable(onClick = onClick),
            shape = RoundedCornerShape(16.dp),
            color = Color.Transparent
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.horizontalGradient(
                            listOf(
                                Color(0xFFE52027),
                                Color(0xFFF15A24),
                                Color(0xFFFF7A45)
                            )
                        )
                    )
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color.White.copy(alpha = 0.22f)
                        ) {
                            Text(
                                text = "ANNOUNCEMENT & INCENTIVES",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = topNotice?.title ?: "সবার আগে সব কাজের আপডেট!",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = topNotice?.content ?: "অন-টাইম উপস্থিতি ও কাজের সেরা পারফরম্যান্স",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 12.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .background(Color.White.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Campaign,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(26.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Carousel Dot Indicators
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(width = 16.dp, height = 6.dp)
                    .background(NagadOrange, RoundedCornerShape(3.dp))
            )
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(Color(0xFFCBD5E1), CircleShape)
            )
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(Color(0xFFCBD5E1), CircleShape)
            )
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(Color(0xFFCBD5E1), CircleShape)
            )
        }
    }
}

/**
 * Services Quick Row (Nagad-style Workplace Utilities)
 */
@Composable
private fun ServicesQuickRow(
    isCheckedIn: Boolean,
    isCheckedOut: Boolean,
    onPunchClick: () -> Unit,
    onLunchClick: () -> Unit,
    onScheduleClick: () -> Unit,
    onProductsClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        ServiceIconCard(
            title = "Quick Punch",
            icon = Icons.Outlined.Fingerprint,
            badge = if (isCheckedOut) "Done" else if (isCheckedIn) "In" else "Ready",
            onClick = onPunchClick,
            modifier = Modifier.weight(1f)
        )
        ServiceIconCard(
            title = "Dedicated Lunch",
            icon = Icons.Outlined.Restaurant,
            badge = "60m",
            onClick = onLunchClick,
            modifier = Modifier.weight(1f)
        )
        ServiceIconCard(
            title = "Duty Shifts",
            icon = Icons.Outlined.EventNote,
            badge = "Roster",
            onClick = onScheduleClick,
            modifier = Modifier.weight(1f)
        )
        ServiceIconCard(
            title = "Store Items",
            icon = Icons.Outlined.Inventory2,
            badge = "Items",
            onClick = onProductsClick,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun ServiceIconCard(
    title: String,
    icon: ImageVector,
    badge: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .height(86.dp)
            .shadow(elevation = 2.dp, shape = RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color(0xFFF1F5F9))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(vertical = 10.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(NagadSurfaceTint, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = NagadOrange,
                    modifier = Modifier.size(20.dp)
                )
            }

            Text(
                text = title,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = Slate800,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * Today's Attendance & Duty Summary Card
 */
@Composable
private fun TodayDutySummaryCard(
    today: AttendanceRecord?,
    isCheckedIn: Boolean,
    isCheckedOut: Boolean,
    dutySchedule: DutyScheduleDto?,
    dutyStartTime: String,
    dutyEndTime: String,
    checkOutOpenTime: String,
    isCheckOutVisible: Boolean,
    currentTimeString: String,
    onOpenPunchSheet: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = BorderStroke(1.dp, Color(0xFFF1F5F9))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
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
                        imageVector = Icons.Default.AccessTime,
                        contentDescription = null,
                        tint = NagadOrange,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Today's Attendance",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = when {
                        isCheckedOut -> Color(0xFFECFDF5)
                        isCheckedIn -> Color(0xFFEFF6FF)
                        else -> Color(0xFFFFFBEB)
                    },
                    border = BorderStroke(
                        1.dp,
                        when {
                            isCheckedOut -> Emerald500
                            isCheckedIn -> Blue500
                            else -> Amber500
                        }
                    )
                ) {
                    Text(
                        text = when {
                            isCheckedOut -> "COMPLETED"
                            isCheckedIn -> "CLOCKED IN"
                            else -> "NOT CLOCKED IN"
                        },
                        color = when {
                            isCheckedOut -> Emerald700
                            isCheckedIn -> Blue600
                            else -> Amber500
                        },
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            // Timings Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Check In", color = Slate500, fontSize = 11.5.sp)
                    Text(
                        text = DateUtils.formatTime(today?.displayCheckIn),
                        color = Slate900,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = "Duty Shift", color = Slate500, fontSize = 11.5.sp)
                    Text(
                        text = "$dutyStartTime - $dutyEndTime",
                        color = Slate800,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Check Out", color = Slate500, fontSize = 11.5.sp)
                    Text(
                        text = DateUtils.formatTime(today?.displayCheckOut),
                        color = Slate900,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }
            }

            // Action / Info Button
            Button(
                onClick = onOpenPunchSheet,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (!isCheckedIn) NagadOrange else if (!isCheckedOut) NagadRed else Slate800,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(46.dp)
            ) {
                Icon(
                    imageVector = if (!isCheckedIn) Icons.Default.Login else if (!isCheckedOut) Icons.Default.Logout else Icons.Default.Check,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (!isCheckedIn) "Clock In with GPS & Wi-Fi" else if (!isCheckedOut) "Punch / Check Out" else "Shift Completed",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.5.sp
                )
            }
        }
    }
}

/**
 * Active Break Live Countdown Card
 */
@Composable
private fun ActiveBreakLiveCard(
    uiState: HomeUiState,
    onResumeBreak: () -> Unit,
    onPauseBreak: () -> Unit,
    onEndBreak: () -> Unit
) {
    val statusColor = when (uiState.activeBreakStatusColor) {
        "ROSE" -> Rose500
        "AMBER" -> Amber500
        else -> Emerald500
    }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp)),
        shape = RoundedCornerShape(16.dp),
        color = Color.White,
        border = BorderStroke(1.5.dp, statusColor.copy(alpha = 0.7f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
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
                    Icon(Icons.Default.Timer, contentDescription = null, tint = statusColor, modifier = Modifier.size(20.dp))
                    Text(
                        text = uiState.activeBreak?.type ?: "Active Break",
                        fontWeight = FontWeight.Bold,
                        color = Slate900,
                        fontSize = 15.sp
                    )
                }

                Surface(
                    color = statusColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = uiState.activeBreakStatusText.ifEmpty { "ACTIVE" },
                        color = statusColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = uiState.activeBreakCountdown.ifEmpty { "00:00" },
                    fontSize = 36.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = if (uiState.activeBreakStatusColor == "ROSE") Rose500 else Slate900,
                    letterSpacing = 1.sp
                )
                Text(
                    text = if (uiState.activeBreakStatusColor == "ROSE") "Overstay Countdown" else "Time Remaining",
                    color = Slate500,
                    fontSize = 11.5.sp
                )
            }

            if (uiState.activeBreakFineText != null) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFEF2F2),
                    border = BorderStroke(1.dp, Color(0xFFFECACA)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.WarningAmber, contentDescription = null, tint = Rose500, modifier = Modifier.size(16.dp))
                        Text(
                            text = uiState.activeBreakFineText!!,
                            color = Rose500,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (uiState.activeBreak?.isPaused == true) {
                    Button(
                        onClick = onResumeBreak,
                        enabled = !uiState.isStartingBreak && !uiState.isEndingBreak,
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald600, contentColor = Color.White),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        Text("Resume Break", fontWeight = FontWeight.Bold)
                    }
                } else {
                    Button(
                        onClick = onPauseBreak,
                        enabled = !uiState.isStartingBreak && !uiState.isEndingBreak,
                        colors = ButtonDefaults.buttonColors(containerColor = Amber500, contentColor = Color.White),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        Text("Pause Break", fontWeight = FontWeight.Bold)
                    }
                }

                Button(
                    onClick = onEndBreak,
                    enabled = !uiState.isEndingBreak && !uiState.isStartingBreak,
                    colors = ButtonDefaults.buttonColors(containerColor = Rose500, contentColor = Color.White),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).height(44.dp)
                ) {
                    Text("End Break", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

/**
 * Quick Attendance Punch Modal Bottom Sheet Content
 */
@Composable
private fun QuickPunchSheetContent(
    uiState: HomeUiState,
    isCheckedIn: Boolean,
    isCheckedOut: Boolean,
    isCheckOutVisible: Boolean,
    checkOutOpenTime: String,
    formattedDutyEnd: String,
    onClockAction: () -> Unit,
    onDismiss: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Drag handle indicator
        Box(
            modifier = Modifier
                .size(width = 40.dp, height = 4.dp)
                .background(Color(0xFFCBD5E1), RoundedCornerShape(2.dp))
        )

        Text(
            text = "Quick Attendance Punch",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.Bold,
                color = Slate900,
                fontSize = 20.sp
            )
        )

        Text(
            text = uiState.currentTimeString.ifEmpty { "--:--:--" },
            style = MaterialTheme.typography.headlineLarge.copy(
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = NagadOrange
            )
        )

        Text(
            text = uiState.currentDateString.ifEmpty { "Today" },
            color = Slate500,
            fontSize = 13.sp
        )

        // GPS and Wi-Fi validation badge
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = Color(0xFFF1F5F9),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.GpsFixed, contentDescription = null, tint = NagadOrange, modifier = Modifier.size(18.dp))
                Text(
                    text = "Office GPS geofence & Wi-Fi radar active",
                    color = Slate700,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // Punch Action Button
        when {
            !isCheckedIn -> {
                Button(
                    onClick = {
                        onClockAction()
                        onDismiss()
                    },
                    enabled = !uiState.isClocking,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = NagadOrange,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                ) {
                    if (uiState.isClocking) {
                        CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                    } else {
                        Icon(Icons.Default.Login, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("PUNCH IN NOW", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
            !isCheckedOut -> {
                if (isCheckOutVisible) {
                    Button(
                        onClick = {
                            onClockAction()
                            onDismiss()
                        },
                        enabled = !uiState.isClocking,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = NagadRed,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                    ) {
                        if (uiState.isClocking) {
                            CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Default.Logout, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("PUNCH OUT NOW", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }
                } else {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFFFFBEB),
                        border = BorderStroke(1.dp, Color(0xFFFDE68A)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Schedule, contentDescription = null, tint = Amber500, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Check-out opens at $checkOutOpenTime", fontWeight = FontWeight.Bold, color = Slate900, fontSize = 13.sp)
                                Text("Available 1h before duty ends ($formattedDutyEnd)", color = Slate600, fontSize = 11.5.sp)
                            }
                        }
                    }
                }
            }
            else -> {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFECFDF5),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald600, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Text("Shift Completed for Today!", fontWeight = FontWeight.Bold, color = Emerald700)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))
    }
}

/**
 * Duty Schedule Bottom Sheet
 */
@Composable
private fun DutyScheduleSheetContent(
    uiState: HomeUiState,
    dutySchedule: DutyScheduleDto?,
    dutyStartTime: String,
    dutyEndTime: String,
    onDismiss: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(width = 40.dp, height = 4.dp)
                .background(Color(0xFFCBD5E1), RoundedCornerShape(2.dp))
                .align(Alignment.CenterHorizontally)
        )

        Text(
            text = "My Duty Schedule & Rosters",
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.Bold,
                color = Slate900,
                fontSize = 18.sp
            )
        )

        Surface(
            shape = RoundedCornerShape(14.dp),
            color = Color(0xFFFFF4EE),
            border = BorderStroke(1.dp, Color(0xFFFFD8C2)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text = "Active Duty Shift", color = NagadOrange, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(text = "$dutyStartTime — $dutyEndTime", color = Slate900, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                Text(text = dutySchedule?.name ?: "Standard Company Shift", color = Slate700, fontSize = 13.sp)
            }
        }

        if (uiState.dutyRosters.isNotEmpty()) {
            Text(
                text = "Upcoming Roster Dates (${uiState.dutyRosters.size} Days)",
                fontWeight = FontWeight.Bold,
                color = Slate900,
                fontSize = 14.sp
            )

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                uiState.dutyRosters.take(4).forEach { roster ->
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Color.White,
                        border = BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = roster.dateFormatted ?: roster.date, color = Slate900, fontWeight = FontWeight.SemiBold)
                            Text(text = "${roster.startTime} - ${roster.endTime}", color = NagadOrange, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
    }
}
