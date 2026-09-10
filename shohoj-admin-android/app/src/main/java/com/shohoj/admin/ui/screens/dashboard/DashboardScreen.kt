package com.shohoj.admin.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormat = remember { NumberFormat.getNumberInstance(Locale.US) }

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = state.dashboardData?.company?.name ?: "Shohoj Admin",
                subtitle = "${state.dashboardData?.user?.name ?: "Owner"} • ${state.dashboardData?.user?.role ?: "Administrator"}",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Dashboard.route,
                onNavigate = onNavigate
            )
        },
        containerColor = Slate950
    ) { padding ->
        if (state.isLoading) {
            LoadingState(modifier = Modifier.padding(padding))
        } else if (state.errorMessage != null) {
            EmptyState(
                message = state.errorMessage!!,
                icon = Icons.Default.Warning,
                modifier = Modifier.padding(padding)
            )
        } else {
            val data = state.dashboardData ?: return@Scaffold
            val att = data.attendanceStats
            val fin = data.financialSummary

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // FEATURE 2: EMPLOYEES PRESENT TODAY FEATURED CARD
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
                            .clickable { onNavigate(Screen.Attendance.route) },
                        colors = CardDefaults.cardColors(containerColor = CardBackground)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(Emerald500.copy(alpha = 0.18f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = Emerald400,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "Today's Attendance",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = Slate100
                                        )
                                        Text(
                                            text = "Live Employee Presence",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Slate400
                                        )
                                    }
                                }
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "View Details",
                                    tint = Slate500
                                )
                            }

                            Spacer(modifier = Modifier.height(18.dp))

                            // Big Present Counter
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                Column {
                                    Text(
                                        text = "${att.presentToday}",
                                        style = MaterialTheme.typography.headlineLarge,
                                        fontSize = 38.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Emerald400
                                    )
                                    Text(
                                        text = "Present Today",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = Slate300
                                    )
                                }
                                Text(
                                    text = "Total Staff: ${att.totalActiveEmployees}",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = Slate400
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Attendance Breakdown Chips
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AttendanceStatPill(
                                    label = "Late",
                                    value = "${att.lateToday}",
                                    color = Amber400,
                                    bgColor = Amber500.copy(alpha = 0.15f),
                                    modifier = Modifier.weight(1f)
                                )
                                AttendanceStatPill(
                                    label = "Absent",
                                    value = "${att.absentToday}",
                                    color = Rose400,
                                    bgColor = Rose500.copy(alpha = 0.15f),
                                    modifier = Modifier.weight(1f)
                                )
                                AttendanceStatPill(
                                    label = "Unmarked",
                                    value = "${att.unmarkedToday}",
                                    color = Slate400,
                                    bgColor = Slate800,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }

                // FEATURE 5: FINANCIAL REPORT EXECUTIVE SNAPSHOT
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
                            .clickable { onNavigate(Screen.Finance.route) },
                        colors = CardDefaults.cardColors(containerColor = CardBackground)
                    ) {
                        Column(modifier = Modifier.padding(18.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(40.dp)
                                            .clip(CircleShape)
                                            .background(Indigo500.copy(alpha = 0.18f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.AccountBalance,
                                            contentDescription = null,
                                            tint = Indigo500,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column {
                                        Text(
                                            text = "Financial Overview",
                                            style = MaterialTheme.typography.titleMedium,
                                            color = Slate100
                                        )
                                        Text(
                                            text = "Revenue & Profit Summary",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Slate400
                                        )
                                    }
                                }
                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "View Details",
                                    tint = Slate500
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text("Net Profit", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                    Text(
                                        text = "৳ ${currencyFormat.format(fin.netProfit)}",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = if (fin.netProfit >= 0) Emerald400 else Rose400
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Revenue", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                    Text(
                                        text = "৳ ${currencyFormat.format(fin.totalIncome)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Slate200
                                    )
                                }
                            }
                        }
                    }
                }

                // 2x2 METRICS GRID: PROJECTS, LEADS, LEAVES, EMPLOYEES
                item {
                    Text(
                        text = "Executive Key Metrics",
                        style = MaterialTheme.typography.titleMedium,
                        color = Slate200
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ExecutiveMetricCard(
                            title = "Active Projects",
                            value = "${data.projectStats.active}",
                            subtitle = "${data.projectStats.total} Total Projects",
                            icon = Icons.Default.Work,
                            accentColor = Sky400,
                            modifier = Modifier.weight(1f),
                            onClick = { onNavigate(Screen.Projects.route) }
                        )
                        ExecutiveMetricCard(
                            title = "CRM Leads",
                            value = "${data.leadStats.total}",
                            subtitle = "${data.leadStats.wonLeads} Deals Won",
                            icon = Icons.Default.TrendingUp,
                            accentColor = Violet500,
                            modifier = Modifier.weight(1f),
                            onClick = { onNavigate(Screen.Leads.route) }
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ExecutiveMetricCard(
                            title = "Pending Leaves",
                            value = "${data.pendingLeavesCount}",
                            subtitle = "Requires Review",
                            icon = Icons.Default.DateRange,
                            accentColor = Amber500,
                            modifier = Modifier.weight(1f),
                            onClick = { onNavigate(Screen.Leaves.route) }
                        )
                        ExecutiveMetricCard(
                            title = "Staff Roster",
                            value = "${att.totalActiveEmployees}",
                            subtitle = "Active Employees",
                            icon = Icons.Default.People,
                            accentColor = Indigo500,
                            modifier = Modifier.weight(1f),
                            onClick = { onNavigate(Screen.Employees.route) }
                        )
                    }
                }

                // QUICK ACTION NAVIGATION GRID
                item {
                    Text(
                        text = "Quick Navigation",
                        style = MaterialTheme.typography.titleMedium,
                        color = Slate200
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        QuickNavButton(
                            title = "Staff",
                            icon = Icons.Default.People,
                            color = Indigo500,
                            modifier = Modifier.weight(1f)
                        ) { onNavigate(Screen.Employees.route) }
                        QuickNavButton(
                            title = "Projects",
                            icon = Icons.Default.Work,
                            color = Sky400,
                            modifier = Modifier.weight(1f)
                        ) { onNavigate(Screen.Projects.route) }
                        QuickNavButton(
                            title = "Leads",
                            icon = Icons.Default.TrendingUp,
                            color = Violet500,
                            modifier = Modifier.weight(1f)
                        ) { onNavigate(Screen.Leads.route) }
                        QuickNavButton(
                            title = "Leaves",
                            icon = Icons.Default.DateRange,
                            color = Amber500,
                            modifier = Modifier.weight(1f)
                        ) { onNavigate(Screen.Leaves.route) }
                    }
                }

                // RECENT ATTENDANCE PUNCHES
                if (data.recentPunches.isNotEmpty()) {
                    item {
                        Text(
                            text = "Recent Attendance Activity",
                            style = MaterialTheme.typography.titleMedium,
                            color = Slate200
                        )
                    }
                    items(data.recentPunches) { punch ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(14.dp)),
                            colors = CardDefaults.cardColors(containerColor = Slate900)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(Slate800),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = punch.employeeName.take(2).uppercase(),
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate200
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = punch.employeeName,
                                            style = MaterialTheme.typography.titleMedium,
                                            color = Slate100
                                        )
                                        Text(
                                            text = "${punch.employeeId} • ${punch.designation}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Slate400
                                        )
                                    }
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    StatusBadge(status = punch.status)
                                    if (punch.checkInTime != null) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = punch.checkInTime.substringAfter("T").take(5),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = Slate400
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
}

@Composable
private fun AttendanceStatPill(
    label: String,
    value: String,
    color: Color,
    bgColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = color)
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = Slate400)
        }
    }
}

@Composable
private fun QuickNavButton(
    title: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Slate900)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = title, tint = color, modifier = Modifier.size(18.dp))
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = title, style = MaterialTheme.typography.labelSmall, color = Slate300)
        }
    }
}
