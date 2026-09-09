package com.shohoj.staff.ui.screens.tasks

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
fun TaskScreen(
    onNavigate: (String) -> Unit,
    viewModel: TaskViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    val filteredTasks = remember(uiState.tasks, uiState.filterStatus) {
        if (uiState.filterStatus == "ALL") {
            uiState.tasks
        } else {
            uiState.tasks.filter { it.status.equals(uiState.filterStatus, ignoreCase = true) }
        }
    }

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "My Tasks",
                subtitle = "Assigned duties & status"
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Tasks.route,
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
            // Filter chips
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("ALL", "Pending", "In Progress", "Completed").forEach { status ->
                        val isSelected = uiState.filterStatus == status
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.setFilter(status) },
                            label = { Text(status, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Emerald500,
                                selectedLabelColor = Slate950,
                                containerColor = Slate800,
                                labelColor = Slate300
                            )
                        )
                    }
                }
            }

            // Status message
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

            if (filteredTasks.isEmpty() && !uiState.isLoading) {
                item {
                    EmptyStateView(
                        title = "No Tasks Found",
                        description = "There are no tasks under the selected filter."
                    )
                }
            } else {
                items(filteredTasks) { task ->
                    var showDropdown by remember { mutableStateOf(false) }

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
                                    text = task.title,
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Slate50,
                                        fontSize = 15.sp
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                StatusBadge(status = task.priority ?: "Medium")
                            }

                            if (!task.description.isNullOrBlank()) {
                                Text(
                                    text = task.description,
                                    style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 13.sp)
                                )
                            }

                            Divider(color = Slate700, thickness = 0.5.dp)

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Due date
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Event, contentDescription = null, tint = Slate500, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Due: ${DateUtils.formatDate(task.dueDate)}",
                                        style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 11.sp)
                                    )
                                }

                                // Interactive Status Dropdown Menu
                                Box {
                                    OutlinedButton(
                                        onClick = { showDropdown = true },
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate300),
                                        border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.linearGradient(listOf(Slate700, Slate700))),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(text = task.status, fontSize = 12.sp)
                                        Icon(Icons.Default.ArrowDropDown, contentDescription = null, modifier = Modifier.size(16.dp))
                                    }

                                    DropdownMenu(
                                        expanded = showDropdown,
                                        onDismissRequest = { showDropdown = false },
                                        modifier = Modifier.background(Slate800)
                                    ) {
                                        listOf("Pending", "In Progress", "Completed", "Blocked").forEach { statusOption ->
                                            DropdownMenuItem(
                                                text = { Text(statusOption, color = Slate50) },
                                                onClick = {
                                                    showDropdown = false
                                                    viewModel.updateStatus(task.id, statusOption)
                                                }
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
