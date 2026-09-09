package com.shohoj.staff.ui.screens.payroll

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils

@Composable
fun PayrollScreen(
    onNavigate: (String) -> Unit,
    viewModel: PayrollViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) } // 0: Payslips, 1: Bonuses, 2: Deductions

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "Payroll & Payslips",
                subtitle = "Earnings, bonuses & deductions"
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Payroll.route,
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
            // Latest Payslip Feature Card
            val latest = uiState.latestPayslip
            if (latest != null) {
                item {
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
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "Latest Payslip",
                                        style = MaterialTheme.typography.labelSmall.copy(color = Emerald400, fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = DateUtils.formatMonthYear(latest.month, latest.year),
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                                    )
                                }
                                StatusBadge(status = latest.status ?: "PAID")
                            }

                            Divider(color = Slate700, thickness = 0.5.dp)

                            // Breakdown details
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(text = "Basic Salary", style = MaterialTheme.typography.bodyMedium.copy(color = Slate400))
                                Text(text = DateUtils.formatCurrency(latest.basicSalary), style = MaterialTheme.typography.bodyMedium.copy(color = Slate300))
                            }

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(text = "Gross Salary", style = MaterialTheme.typography.bodyMedium.copy(color = Slate400))
                                Text(text = DateUtils.formatCurrency(latest.grossSalary), style = MaterialTheme.typography.bodyMedium.copy(color = Slate300))
                            }

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(text = "Total Deductions", style = MaterialTheme.typography.bodyMedium.copy(color = Rose400))
                                Text(text = "- ${DateUtils.formatCurrency(latest.totalDeductions)}", style = MaterialTheme.typography.bodyMedium.copy(color = Rose400))
                            }

                            Divider(color = Slate700, thickness = 0.5.dp)

                            // Net Payable
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Net Disbursed",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                                )
                                Text(
                                    text = DateUtils.formatCurrency(latest.netSalary),
                                    style = MaterialTheme.typography.headlineMedium.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Emerald400,
                                        fontSize = 22.sp
                                    )
                                )
                            }
                        }
                    }
                }
            }

            // Tab Selector
            item {
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = Slate900,
                    contentColor = Slate300,
                    indicator = {},
                    divider = {},
                    modifier = Modifier.background(Slate900, RoundedCornerShape(12.dp)).padding(4.dp)
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Payslips (${uiState.payslips.size})", fontSize = 13.sp) },
                        selectedContentColor = Emerald400,
                        unselectedContentColor = Slate400
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Bonuses (${uiState.bonuses.size})", fontSize = 13.sp) },
                        selectedContentColor = Emerald400,
                        unselectedContentColor = Slate400
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("Deductions (${uiState.deductions.size})", fontSize = 13.sp) },
                        selectedContentColor = Emerald400,
                        unselectedContentColor = Slate400
                    )
                }
            }

            // Content according to tab
            when (selectedTab) {
                0 -> {
                    if (uiState.payslips.isEmpty() && !uiState.isLoading) {
                        item {
                            EmptyStateView(title = "No Payslips", description = "Your payslips will appear here once generated.")
                        }
                    } else {
                        items(uiState.payslips) { item ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(CardBackground, RoundedCornerShape(14.dp))
                                    .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                                    .padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(
                                            text = DateUtils.formatMonthYear(item.month, item.year),
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                                        )
                                        Text(
                                            text = "Basic: ${DateUtils.formatCurrency(item.basicSalary)}",
                                            style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp)
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text(
                                            text = DateUtils.formatCurrency(item.netSalary),
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Emerald400)
                                        )
                                        StatusBadge(status = item.status ?: "PAID")
                                    }
                                }
                            }
                        }
                    }
                }
                1 -> {
                    if (uiState.bonuses.isEmpty()) {
                        item {
                            EmptyStateView(title = "No Bonuses Recorded", description = "Company and festive bonuses will be listed here.")
                        }
                    } else {
                        items(uiState.bonuses) { bonus ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(CardBackground, RoundedCornerShape(14.dp))
                                    .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                                    .padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = bonus.title ?: "Performance Bonus",
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                                        )
                                        Text(
                                            text = bonus.reason ?: "Bonus allocation",
                                            style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp)
                                        )
                                    }
                                    Text(
                                        text = "+ ${DateUtils.formatCurrency(bonus.amount)}",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Emerald400)
                                    )
                                }
                            }
                        }
                    }
                }
                2 -> {
                    if (uiState.deductions.isEmpty()) {
                        item {
                            EmptyStateView(title = "No Deductions", description = "No fines or deductions recorded.")
                        }
                    } else {
                        items(uiState.deductions) { deduction ->
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(CardBackground, RoundedCornerShape(14.dp))
                                    .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                                    .padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = deduction.title ?: "Salary Deduction",
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
                                        )
                                        Text(
                                            text = deduction.reason ?: "Adjustment deduction",
                                            style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 12.sp)
                                        )
                                    }
                                    Text(
                                        text = "- ${DateUtils.formatCurrency(deduction.amount)}",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Rose400)
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
