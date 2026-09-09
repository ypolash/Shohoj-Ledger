package com.shohoj.staff.ui.screens.leave

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaveScreen(
    onNavigate: (String) -> Unit,
    viewModel: LeaveViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "Leave Management",
                subtitle = "Apply & check balances"
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Leave.route,
                onNavigate = onNavigate
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { viewModel.showApplySheet(true) },
                containerColor = Emerald500,
                contentColor = Slate950,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Apply Leave", fontWeight = FontWeight.Bold) }
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
            // Leave Balances Cards
            item {
                Text(
                    text = "Leave Balances",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    LeaveBalanceCard(
                        title = "Casual",
                        used = uiState.balance.casualUsed,
                        total = uiState.balance.casualTotal,
                        tint = Emerald400,
                        modifier = Modifier.weight(1f)
                    )
                    LeaveBalanceCard(
                        title = "Sick",
                        used = uiState.balance.sickUsed,
                        total = uiState.balance.sickTotal,
                        tint = Cyan400,
                        modifier = Modifier.weight(1f)
                    )
                    LeaveBalanceCard(
                        title = "Annual",
                        used = uiState.balance.annualUsed,
                        total = uiState.balance.annualTotal,
                        tint = Amber400,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Success feedback
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

            // Section Title
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Leave History",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                    )
                    IconButton(onClick = { viewModel.loadLeaves() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Slate400)
                    }
                }
            }

            if (uiState.leaves.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyStateView(
                        title = "No Leave Requests",
                        description = "You have not submitted any leave applications yet."
                    )
                }
            } else {
                items(uiState.leaves) { leave ->
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
                                    text = leave.type,
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate50
                                    )
                                )
                                StatusBadge(status = leave.status)
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.DateRange, contentDescription = null, tint = Slate400, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "${DateUtils.formatDate(leave.startDate)} → ${DateUtils.formatDate(leave.endDate)}",
                                    style = MaterialTheme.typography.bodyMedium.copy(color = Slate300, fontSize = 12.sp)
                                )
                            }

                            Text(
                                text = leave.reason,
                                style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 13.sp)
                            )
                        }
                    }
                }
            }
        }

        // Apply Leave Bottom Sheet
        if (uiState.showApplySheet) {
            ModalBottomSheet(
                onDismissRequest = { viewModel.showApplySheet(false) },
                containerColor = Slate900,
                tonalElevation = 16.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Apply for Leave",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = Slate50)
                    )

                    // Error in sheet
                    if (uiState.error != null) {
                        Text(text = uiState.error!!, color = Rose400, fontSize = 12.sp)
                    }

                    // Leave Type Chips
                    Text(text = "Leave Type", style = MaterialTheme.typography.bodyMedium.copy(color = Slate400))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("CASUAL", "SICK", "ANNUAL", "UNPAID").forEach { type ->
                            val isSelected = uiState.applyType == type
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.onTypeChange(type) },
                                label = { Text(type, fontSize = 12.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Emerald500,
                                    selectedLabelColor = Slate950,
                                    containerColor = Slate800,
                                    labelColor = Slate300
                                )
                            )
                        }
                    }

                    // Date range
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = uiState.applyStartDate,
                            onValueChange = { viewModel.onStartDateChange(it) },
                            label = { Text("Start Date") },
                            placeholder = { Text("YYYY-MM-DD") },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate700,
                                focusedTextColor = Slate50,
                                unfocusedTextColor = Slate50
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = uiState.applyEndDate,
                            onValueChange = { viewModel.onEndDateChange(it) },
                            label = { Text("End Date") },
                            placeholder = { Text("YYYY-MM-DD") },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate700,
                                focusedTextColor = Slate50,
                                unfocusedTextColor = Slate50
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // Reason
                    OutlinedTextField(
                        value = uiState.applyReason,
                        onValueChange = { viewModel.onReasonChange(it) },
                        label = { Text("Reason") },
                        placeholder = { Text("Describe the purpose of your leave...") },
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Emerald500,
                            unfocusedBorderColor = Slate700,
                            focusedTextColor = Slate50,
                            unfocusedTextColor = Slate50
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Submit Button
                    Button(
                        onClick = { viewModel.submitLeaveApplication() },
                        enabled = !uiState.isSubmitting,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Emerald500,
                            contentColor = Slate950
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        if (uiState.isSubmitting) {
                            CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        } else {
                            Text("Submit Application", fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
fun LeaveBalanceCard(
    title: String,
    used: Int,
    total: Int,
    tint: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    val remaining = maxOf(0, total - used)
    val progress = if (total > 0) used.toFloat() / total.toFloat() else 0f

    Box(
        modifier = modifier
            .background(CardBackground, RoundedCornerShape(14.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = title, style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp))
            Text(
                text = "$remaining Left",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50, fontSize = 16.sp)
            )
            LinearProgressIndicator(
                progress = progress.coerceIn(0f, 1f),
                color = tint,
                trackColor = Slate700,
                modifier = Modifier.fillMaxWidth().height(4.dp)
            )
            Text(text = "$used of $total used", style = MaterialTheme.typography.labelSmall.copy(color = Slate500, fontSize = 10.sp))
        }
    }
}
