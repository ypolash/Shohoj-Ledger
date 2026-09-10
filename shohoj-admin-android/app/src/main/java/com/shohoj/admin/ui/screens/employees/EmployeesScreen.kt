package com.shohoj.admin.ui.screens.employees

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
import com.shohoj.admin.data.model.EmployeeItem
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EmployeesScreen(
    viewModel: EmployeesViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormat = remember { NumberFormat.getNumberInstance(Locale.US) }

    // Detail Bottom Sheet
    if (state.selectedEmployee != null) {
        val emp = state.selectedEmployee!!
        ModalBottomSheet(
            onDismissRequest = { viewModel.selectEmployee(null) },
            containerColor = Slate900,
            dragHandle = { BottomSheetDefaults.DragHandle(color = Slate600) }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
            ) {
                // Header with Avatar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(Indigo500.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = emp.name.take(2).uppercase(),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Indigo500
                        )
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = emp.name,
                            style = MaterialTheme.typography.titleLarge,
                            color = Slate50
                        )
                        Text(
                            text = "${emp.employeeId} • ${emp.designation}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400
                        )
                    }
                    StatusBadge(status = emp.status)
                }

                Spacer(modifier = Modifier.height(24.dp))
                HorizontalDivider(color = Slate800)
                Spacer(modifier = Modifier.height(16.dp))

                // Detail Rows
                DetailItemRow(icon = Icons.Default.Business, label = "Department", value = emp.department)
                DetailItemRow(icon = Icons.Default.Email, label = "Email", value = emp.email)
                DetailItemRow(icon = Icons.Default.Phone, label = "Phone", value = emp.phone ?: "Not Provided")
                DetailItemRow(
                    icon = Icons.Default.Payments,
                    label = "Basic Salary",
                    value = "৳ ${currencyFormat.format(emp.basicSalary)}"
                )
                DetailItemRow(
                    icon = Icons.Default.CalendarMonth,
                    label = "Joining Date",
                    value = emp.joiningDate?.take(10) ?: "Not Set"
                )
                DetailItemRow(
                    icon = Icons.Default.SupervisorAccount,
                    label = "Reporting Manager",
                    value = emp.reportingManager ?: "None"
                )

                if (!emp.emergencyContact.isNullOrBlank() || !emp.emergencyPhone.isNullOrBlank()) {
                    DetailItemRow(
                        icon = Icons.Default.ContactEmergency,
                        label = "Emergency Contact",
                        value = "${emp.emergencyContact ?: ""} (${emp.emergencyPhone ?: ""})"
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = "Employees Directory",
                subtitle = "${state.employees.size} Registered Staff",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Employees.route,
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
                placeholder = "Search by name, ID, or designation..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf("ALL", "ACTIVE", "INACTIVE")
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

            // Content
            if (state.isLoading) {
                LoadingState()
            } else if (state.employees.isEmpty()) {
                EmptyState(
                    message = if (state.searchQuery.isNotEmpty()) "No employees matching \"${state.searchQuery}\"" else "No employees found in company.",
                    icon = Icons.Default.PersonOff
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(state.employees) { emp ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                .clickable { viewModel.selectEmployee(emp) },
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(Indigo500.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = emp.name.take(2).uppercase(),
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Indigo500
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Text(
                                            text = emp.name,
                                            style = MaterialTheme.typography.titleMedium,
                                            color = Slate100
                                        )
                                        StatusBadge(status = emp.status)
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "${emp.employeeId} • ${emp.designation}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Slate400
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = emp.department,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Violet400
                                    )
                                }

                                Icon(
                                    imageVector = Icons.Default.ChevronRight,
                                    contentDescription = "View",
                                    tint = Slate500
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
private fun DetailItemRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(Slate800),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = Slate300,
                modifier = Modifier.size(18.dp)
            )
        }
        Spacer(modifier = Modifier.width(14.dp))
        Column {
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = Slate400)
            Text(text = value, style = MaterialTheme.typography.bodyLarge, color = Slate100)
        }
    }
}
