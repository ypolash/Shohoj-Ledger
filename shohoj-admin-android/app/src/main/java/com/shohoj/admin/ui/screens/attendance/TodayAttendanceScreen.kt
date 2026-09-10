package com.shohoj.admin.ui.screens.attendance

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*

@Composable
fun TodayAttendanceScreen(
    viewModel: AttendanceViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = "Today's Attendance",
                subtitle = state.attendanceData?.let { "${it.stats.presentToday} / ${it.stats.totalActiveEmployees} Present" } ?: "Live Attendance",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Attendance.route,
                onNavigate = onNavigate
            )
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            if (state.isLoading) {
                LoadingState()
            } else if (state.errorMessage != null) {
                EmptyState(
                    message = state.errorMessage!!,
                    icon = Icons.Default.Warning
                )
            } else {
                val data = state.attendanceData ?: return@Scaffold
                val stats = data.stats

                // KPI Banner Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(18.dp))
                        .border(1.dp, CardBorder, RoundedCornerShape(18.dp)),
                    colors = CardDefaults.cardColors(containerColor = CardBackground)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Daily Attendance Summary",
                            style = MaterialTheme.typography.titleMedium,
                            color = Slate100
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            AttendanceCounterPill(
                                label = "Present",
                                value = "${stats.presentToday}",
                                color = Emerald400,
                                bgColor = Emerald500.copy(alpha = 0.15f),
                                modifier = Modifier.weight(1f)
                            )
                            AttendanceCounterPill(
                                label = "Late",
                                value = "${stats.lateToday}",
                                color = Amber400,
                                bgColor = Amber500.copy(alpha = 0.15f),
                                modifier = Modifier.weight(1f)
                            )
                            AttendanceCounterPill(
                                label = "Absent",
                                value = "${stats.absentToday}",
                                color = Rose400,
                                bgColor = Rose500.copy(alpha = 0.15f),
                                modifier = Modifier.weight(1f)
                            )
                            AttendanceCounterPill(
                                label = "Unmarked",
                                value = "${stats.unmarkedToday}",
                                color = Slate400,
                                bgColor = Slate800,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Status Filter Chips
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val filters = listOf("ALL", "PRESENT", "LATE", "ABSENT", "UNMARKED")
                    items(filters) { status ->
                        val isSelected = state.selectedStatus == status
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.onStatusFilterChange(status) },
                            label = {
                                Text(
                                    text = status,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) Slate50 else Slate400
                                )
                            },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Indigo500,
                                containerColor = Slate900
                            ),
                            border = FilterChipDefaults.filterChipBorder(
                                borderColor = if (isSelected) Indigo500 else Slate800,
                                selectedBorderColor = Indigo500,
                                enabled = true,
                                selected = isSelected
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Roster List
                if (data.roster.isEmpty()) {
                    EmptyState(
                        message = "No attendance records found for selected filter.",
                        icon = Icons.Default.EventBusy
                    )
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        contentPadding = PaddingValues(bottom = 16.dp)
                    ) {
                        items(data.roster) { item ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                                colors = CardDefaults.cardColors(containerColor = Slate900)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(42.dp)
                                            .clip(CircleShape)
                                            .background(Slate800),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = item.name.take(2).uppercase(),
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate200
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = item.name,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = Slate100
                                            )
                                            StatusBadge(status = item.status)
                                        }
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "${item.employeeId} • ${item.designation}",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = Slate400
                                        )

                                        if (item.checkInTime != null) {
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    imageVector = Icons.Default.Login,
                                                    contentDescription = null,
                                                    tint = Emerald400,
                                                    modifier = Modifier.size(14.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    text = "In: ${item.checkInTime.substringAfter("T").take(5)}",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = Slate300
                                                )

                                                if (item.checkOutTime != null) {
                                                    Spacer(modifier = Modifier.width(10.dp))
                                                    Icon(
                                                        imageVector = Icons.Default.Logout,
                                                        contentDescription = null,
                                                        tint = Rose400,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = "Out: ${item.checkOutTime.substringAfter("T").take(5)}",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = Slate300
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    if (item.isLate && item.lateMinutes > 0) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Amber500.copy(alpha = 0.18f))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "${item.lateMinutes}m Late",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = Amber400
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
}

@Composable
private fun AttendanceCounterPill(
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
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = Slate400
            )
        }
    }
}
