package com.shohoj.staff.ui.screens.leave

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
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
                title = "Leave & Short Breaks",
                subtitle = "Apply, track live breaks & quotas"
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
                text = { Text("Request Leave / Break", fontWeight = FontWeight.Bold) }
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
            // 1. ACTIVE LIVE BREAK COUNTDOWN CARD (When employee is on an active short break)
            if (uiState.activeBreak != null) {
                item {
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
                            .padding(20.dp)
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Header row
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

                            // Big live timer
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = uiState.activeBreakCountdown.ifEmpty { "00:00" },
                                    style = MaterialTheme.typography.headlineLarge.copy(
                                        fontSize = 42.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = 2.sp,
                                        color = if (uiState.activeBreakStatusColor == "ROSE") Rose400 else Slate50
                                    )
                                )
                                Text(
                                    text = if (uiState.activeBreakStatusColor == "ROSE") "Overstay Countdown" else "Time Remaining",
                                    color = Slate400,
                                    fontSize = 12.sp
                                )
                            }

                            // Fine warning pill if overstayed or in grace
                            if (uiState.activeBreakFineText != null) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(statusColor.copy(alpha = 0.15f), RoundedCornerShape(8.dp))
                                        .border(1.dp, statusColor.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                        .padding(vertical = 8.dp, horizontal = 12.dp)
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Icon(Icons.Default.WarningAmber, contentDescription = null, tint = statusColor, modifier = Modifier.size(16.dp))
                                        Text(
                                            text = uiState.activeBreakFineText!!,
                                            color = statusColor,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }

                            // End Break Action Button
                            Button(
                                onClick = { viewModel.endActiveBreak() },
                                enabled = !uiState.isEndingBreak,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (uiState.activeBreakStatusColor == "ROSE") Rose500 else Emerald500,
                                    contentColor = Slate950
                                ),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(46.dp)
                            ) {
                                if (uiState.isEndingBreak) {
                                    CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                                } else {
                                    Icon(Icons.Default.StopCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("End Break Now", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }
                        }
                    }
                }
            }

            // 2. LEAVE BALANCES CARDS
            item {
                Text(
                    text = "Leave & Quota Balances",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                )
                Spacer(modifier = Modifier.height(10.dp))

                if (uiState.balances.isNotEmpty()) {
                    val balanceColors = listOf(Emerald400, Cyan400, Amber400, Indigo500, Purple500, Rose400)
                    if (uiState.balances.size <= 3) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            uiState.balances.forEachIndexed { index, b ->
                                LeaveBalanceCard(
                                    title = b.name,
                                    used = b.used,
                                    total = b.total,
                                    isShortBreak = b.isShortBreak || b.quotaModel == "SHORT_BREAK",
                                    breakDuration = b.breakDurationMinutes,
                                    tint = balanceColors[index % balanceColors.size],
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            uiState.balances.forEachIndexed { index, b ->
                                LeaveBalanceCard(
                                    title = b.name,
                                    used = b.used,
                                    total = b.total,
                                    isShortBreak = b.isShortBreak || b.quotaModel == "SHORT_BREAK",
                                    breakDuration = b.breakDurationMinutes,
                                    tint = balanceColors[index % balanceColors.size],
                                    modifier = Modifier.width(135.dp)
                                )
                            }
                        }
                    }
                } else if (!uiState.isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CardBackground, RoundedCornerShape(12.dp))
                            .border(1.dp, CardBorder, RoundedCornerShape(12.dp))
                            .padding(16.dp)
                    ) {
                        Text(
                            text = "No leave quotas or policies configured for your organization.",
                            color = Slate400,
                            fontSize = 13.sp
                        )
                    }
                }
            }

            // 3. SUCCESS / ERROR FEEDBACK
            if (uiState.successMessage != null) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Emerald500.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                            .border(1.dp, Emerald500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Emerald400, modifier = Modifier.size(18.dp))
                            Text(text = uiState.successMessage!!, color = Emerald400, fontSize = 13.sp)
                        }
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
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Rose400, modifier = Modifier.size(18.dp))
                            Text(text = uiState.error!!, color = Rose400, fontSize = 13.sp)
                        }
                    }
                }
            }

            // 4. SECTION TITLE & REFRESH
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Leave & Break History",
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
                        title = "No Records Found",
                        description = "You have not submitted any leave or short break requests yet."
                    )
                }
            } else {
                items(uiState.leaves) { leave ->
                    val isBreak = leave.type.contains("Break", ignoreCase = true) ||
                            leave.reason.contains("Break", ignoreCase = true) ||
                            (leave.comments != null && leave.comments.contains("Break", ignoreCase = true))

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
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    if (isBreak) {
                                        Icon(Icons.Default.Coffee, contentDescription = null, tint = Amber400, modifier = Modifier.size(16.dp))
                                    }
                                    Text(
                                        text = leave.type,
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate50
                                        )
                                    )
                                }
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

                            if (leave.reason.isNotBlank()) {
                                Text(
                                    text = leave.reason,
                                    style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 13.sp)
                                )
                            }

                            if (!leave.comments.isNullOrBlank()) {
                                Text(
                                    text = leave.comments,
                                    style = MaterialTheme.typography.bodySmall.copy(color = Slate500, fontSize = 11.sp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // 5. APPLY LEAVE & SHORT BREAK MODAL BOTTOM SHEET
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
                        text = if (uiState.isShortBreakSelected) "Start Short Break" else "Apply for Leave",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = Slate50)
                    )

                    // Error in sheet
                    if (uiState.error != null) {
                        Text(text = uiState.error!!, color = Rose400, fontSize = 12.sp)
                    }

                    // Leave Type Chips
                    Text(text = "Select Category", style = MaterialTheme.typography.bodyMedium.copy(color = Slate400))
                    val availableTypes = if (uiState.leaveTypes.isNotEmpty()) {
                        uiState.leaveTypes.map { it.name }
                    } else if (uiState.balances.isNotEmpty()) {
                        uiState.balances.map { it.name }
                    } else {
                        emptyList()
                    }

                    if (availableTypes.isEmpty()) {
                        Text("No categories configured. Please contact HR.", color = Slate400, fontSize = 12.sp)
                    } else {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            availableTypes.forEach { type ->
                                val isSelected = uiState.applyType.equals(type, ignoreCase = true)
                                val itemConfig = uiState.leaveTypes.firstOrNull { it.name.equals(type, ignoreCase = true) }
                                val isShort = itemConfig?.isShortBreak == true ||
                                        itemConfig?.quotaModel == "SHORT_BREAK" ||
                                        type.contains("Break", ignoreCase = true)

                                FilterChip(
                                    selected = isSelected,
                                    onClick = { viewModel.onTypeChange(type) },
                                    leadingIcon = if (isShort) {
                                        { Icon(Icons.Default.AvTimer, contentDescription = null, modifier = Modifier.size(16.dp)) }
                                    } else null,
                                    label = { Text(type, fontSize = 12.sp) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = if (isShort) Amber500 else Emerald500,
                                        selectedLabelColor = Slate950,
                                        selectedLeadingIconColor = Slate950,
                                        containerColor = Slate800,
                                        labelColor = Slate300
                                    )
                                )
                            }
                        }
                    }

                    // PRE-REQUEST SHORT BREAK WARNING CARD (Detailed parameters & Instant Auto-Approval notice)
                    if (uiState.isShortBreakSelected) {
                        val selItem = uiState.selectedLeaveTypeItem
                        val duration = selItem?.breakDurationMinutes ?: 30
                        val grace = selItem?.gracePeriodMinutes ?: 5
                        val fine = selItem?.fineAmount ?: 50.0
                        val fineType = selItem?.fineType ?: "FIXED"

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Amber500.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                                .border(1.dp, Amber500.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                                .padding(14.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(Icons.Default.Bolt, contentDescription = null, tint = Amber400, modifier = Modifier.size(18.dp))
                                    Text(
                                        text = "Instant Auto-Approval & Live Timer",
                                        color = Amber400,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Text(
                                    text = "This short break does not require HR approval. When you tap Start Break, your live countdown starts immediately.",
                                    color = Slate300,
                                    fontSize = 12.sp
                                )

                                Divider(color = Amber500.copy(alpha = 0.2f), thickness = 0.5.dp)

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Allowed Duration", color = Slate400, fontSize = 11.sp)
                                        Text("$duration mins", color = Slate50, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Column {
                                        Text("Grace Tolerance", color = Slate400, fontSize = 11.sp)
                                        Text("+$grace mins", color = Emerald400, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Column {
                                        Text("Overstay Fine", color = Slate400, fontSize = 11.sp)
                                        Text(
                                            "৳${fine.toInt()}${if (fineType == "PER_MINUTE") "/m" else ""}",
                                            color = Rose400,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Standard Leave Date Range Pickers
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
                    }

                    // Reason Field
                    OutlinedTextField(
                        value = uiState.applyReason,
                        onValueChange = { viewModel.onReasonChange(it) },
                        label = { Text("Reason / Purpose") },
                        placeholder = { Text(if (uiState.isShortBreakSelected) "e.g. Tea / Coffee Break" else "Describe purpose...") },
                        maxLines = 2,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = if (uiState.isShortBreakSelected) Amber500 else Emerald500,
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
                            containerColor = if (uiState.isShortBreakSelected) Amber500 else Emerald500,
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
                            if (uiState.isShortBreakSelected) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Start Break (Auto-Approved)", fontWeight = FontWeight.Bold)
                            } else {
                                Text("Submit Application", fontWeight = FontWeight.Bold)
                            }
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
    isShortBreak: Boolean = false,
    breakDuration: Int = 30,
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
            Text(text = title, style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp), maxLines = 1)
            if (isShortBreak) {
                Text(
                    text = "${breakDuration}m Timer",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Amber400, fontSize = 15.sp)
                )
                Text(text = "Auto-Approved", style = MaterialTheme.typography.labelSmall.copy(color = Slate500, fontSize = 10.sp))
            } else {
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
}
