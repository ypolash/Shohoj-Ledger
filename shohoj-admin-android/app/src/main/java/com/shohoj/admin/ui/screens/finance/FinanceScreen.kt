package com.shohoj.admin.ui.screens.finance

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
import java.text.NumberFormat
import java.util.Locale

@Composable
fun FinanceScreen(
    viewModel: FinanceViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormat = remember { NumberFormat.getNumberInstance(Locale.US) }

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = "Financial Report",
                subtitle = "Profit & Loss • Balance Sheet • Cash Flow",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Finance.route,
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

            // Period Selection Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val periods = listOf(
                    Pair("all", "All Time"),
                    Pair("month", "This Month"),
                    Pair("quarter", "This Quarter"),
                    Pair("year", "This Year")
                )
                items(periods) { (key, label) ->
                    val isSelected = state.selectedPeriod == key
                    FilterChip(
                        selected = isSelected,
                        onClick = { viewModel.onPeriodChange(key) },
                        label = {
                            Text(
                                text = label,
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

            if (state.isLoading) {
                LoadingState()
            } else if (state.errorMessage != null) {
                EmptyState(
                    message = state.errorMessage!!,
                    icon = Icons.Default.Warning
                )
            } else {
                val data = state.reportData ?: return@Scaffold
                val pl = data.profitAndLoss
                val bs = data.balanceSheet
                val cf = data.cashFlow

                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(bottom = 20.dp)
                ) {
                    // 1. PROFIT & LOSS CARD
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(20.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(20.dp)),
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Profit & Loss Statement",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Slate100
                                    )
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(if (pl.isProfitable) Emerald500.copy(alpha = 0.18f) else Rose500.copy(alpha = 0.18f))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Text(
                                            text = if (pl.isProfitable) "Profitable (+${pl.profitMarginPercent}%)" else "Loss (${pl.profitMarginPercent}%)",
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = if (pl.isProfitable) Emerald400 else Rose400
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                // Big Net Profit Indicator
                                Text(
                                    text = "Net Profit",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate400
                                )
                                Text(
                                    text = "৳ ${currencyFormat.format(pl.netProfit)}",
                                    style = MaterialTheme.typography.headlineLarge,
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (pl.isProfitable) Emerald400 else Rose400
                                )

                                Spacer(modifier = Modifier.height(16.dp))
                                HorizontalDivider(color = Slate800)
                                Spacer(modifier = Modifier.height(14.dp))

                                // Income & Expense Breakdown
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text("Total Income", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "৳ ${currencyFormat.format(pl.totalIncome)}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate100
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Total Expenses", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = "৳ ${currencyFormat.format(pl.totalExpense)}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Slate100
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 2. BALANCE SHEET CARD
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(20.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(20.dp)),
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(
                                    text = "Balance Sheet Summary",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Slate100
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    FinancialStatPill(
                                        title = "Assets",
                                        amount = "৳ ${currencyFormat.format(bs.totalAssets)}",
                                        color = Emerald400,
                                        modifier = Modifier.weight(1f)
                                    )
                                    FinancialStatPill(
                                        title = "Liabilities",
                                        amount = "৳ ${currencyFormat.format(bs.totalLiabilities)}",
                                        color = Rose400,
                                        modifier = Modifier.weight(1f)
                                    )
                                    FinancialStatPill(
                                        title = "Equity",
                                        amount = "৳ ${currencyFormat.format(bs.netEquity)}",
                                        color = Indigo500,
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }
                        }
                    }

                    // 3. CASH FLOW CARD
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(20.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(20.dp)),
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Text(
                                    text = "Cash Flow Overview",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Slate100
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text("Cash Inflow", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                        Text(
                                            text = "৳ ${currencyFormat.format(cf.cashIn)}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Emerald400
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("Cash Outflow", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                        Text(
                                            text = "৳ ${currencyFormat.format(cf.cashOut)}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = Rose400
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Net Cash Flow", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                        Text(
                                            text = "৳ ${currencyFormat.format(cf.netCashFlow)}",
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = FontWeight.Bold,
                                            color = if (cf.netCashFlow >= 0) Emerald400 else Rose400
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
private fun FinancialStatPill(
    title: String,
    amount: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Slate900)
            .border(1.dp, Slate800, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Column {
            Text(text = title, style = MaterialTheme.typography.labelSmall, color = Slate400)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = amount,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}
