package com.shohoj.admin.ui.screens.leaves

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.admin.data.model.LeaveItem
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeavesScreen(
    viewModel: LeavesViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    // Leave Detail Bottom Sheet
    if (state.selectedLeave != null) {
        val leave = state.selectedLeave!!
        ModalBottomSheet(
            onDismissRequest = { viewModel.selectLeave(null) },
            containerColor = Slate900,
            dragHandle = { BottomSheetDefaults.DragHandle(color = Slate600) }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = leave.employeeName,
                            style = MaterialTheme.typography.titleLarge,
                            color = Slate50
                        )
                        Text(
                            text = "${leave.employeeId} • ${leave.designation}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400
                        )
                    }
                    StatusBadge(status = leave.status)
                }

                Spacer(modifier = Modifier.height(20.dp))
                HorizontalDivider(color = Slate800)
                Spacer(modifier = Modifier.height(16.dp))

                LeaveDetailRow(icon = Icons.Default.Category, label = "Leave Type", value = leave.type)
                LeaveDetailRow(
                    icon = Icons.Default.DateRange,
                    label = "Duration",
                    value = "${leave.durationDays} Days (${leave.startDate} → ${leave.endDate})"
                )
                LeaveDetailRow(icon = Icons.Default.Schedule, label = "Applied At", value = leave.appliedAt.take(10))

                Spacer(modifier = Modifier.height(12.dp))
                Text("Reason for Leave", style = MaterialTheme.typography.labelSmall, color = Slate400)
                Spacer(modifier = Modifier.height(6.dp))
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = Slate800)
                ) {
                    Text(
                        text = leave.reason,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate200,
                        modifier = Modifier.padding(14.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = "Leave Requests",
                subtitle = "${state.leaves.size} Applications",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Leaves.route,
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

            // Search Bar
            SearchBarField(
                query = state.searchQuery,
                onQueryChange = { viewModel.onSearchChange(it) },
                placeholder = "Search by employee, leave type, or reason..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Status Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf("ALL", "PENDING", "APPROVED", "REJECTED")
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

            Spacer(modifier = Modifier.height(12.dp))

            // Leaves List
            if (state.isLoading) {
                LoadingState()
            } else if (state.leaves.isEmpty()) {
                EmptyState(
                    message = if (state.searchQuery.isNotEmpty())
                        "No leave requests matching \"${state.searchQuery}\""
                    else
                        "No leave requests found in this category.",
                    icon = Icons.Default.EventBusy
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(state.leaves) { leave ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                .clickable { viewModel.selectLeave(leave) },
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(38.dp)
                                                .clip(CircleShape)
                                                .background(Slate800),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = leave.employeeName.take(2).uppercase(),
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                                color = Slate200
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column {
                                            Text(
                                                text = leave.employeeName,
                                                style = MaterialTheme.typography.titleMedium,
                                                color = Slate100
                                            )
                                            Text(
                                                text = "${leave.employeeId} • ${leave.designation}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Slate400
                                            )
                                        }
                                    }
                                    StatusBadge(status = leave.status)
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Indigo500.copy(alpha = 0.15f))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = "${leave.type} (${leave.durationDays}d)",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = Indigo500
                                        )
                                    }

                                    Text(
                                        text = "${leave.startDate} → ${leave.endDate}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Slate300
                                    )
                                }

                                if (leave.reason.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = leave.reason,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Slate400,
                                        maxLines = 2
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

@Composable
private fun LeaveDetailRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(CircleShape)
                .background(Slate800),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = Slate300, modifier = Modifier.size(16.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = Slate400)
            Text(text = value, style = MaterialTheme.typography.bodyLarge, color = Slate100)
        }
    }
}
