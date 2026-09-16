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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
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
                            val checklistItems = task.checklist?.items ?: emptyList()
                            val completedCount = checklistItems.count { it.completed }
                            val totalCount = checklistItems.size
                            val progressPercent = if (totalCount > 0) completedCount.toFloat() / totalCount.toFloat() else 0f

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
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (checklistItems.isNotEmpty()) {
                                        Box(
                                            modifier = Modifier
                                                .background(Cyan500.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                                .border(1.dp, Cyan500.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = "Checklist",
                                                color = Cyan400,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.SemiBold
                                            )
                                        }
                                    }
                                    StatusBadge(status = task.priority ?: "Medium")
                                }
                            }

                            if (!task.description.isNullOrBlank()) {
                                Text(
                                    text = task.description,
                                    style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 13.sp)
                                )
                            }

                            // Checklist To-Do section under the task card
                            if (checklistItems.isNotEmpty()) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Slate900.copy(alpha = 0.7f), RoundedCornerShape(10.dp))
                                        .border(1.dp, Slate700.copy(alpha = 0.6f), RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    // Checklist Header & Progress Stats
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Checklist,
                                                contentDescription = null,
                                                tint = Cyan400,
                                                modifier = Modifier.size(16.dp)
                                            )
                                            Text(
                                                text = "To-Do Checklist",
                                                style = MaterialTheme.typography.titleSmall.copy(
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = Slate200,
                                                    fontSize = 12.sp
                                                )
                                            )
                                        }

                                        Text(
                                            text = "$completedCount/$totalCount (${(progressPercent * 100).toInt()}%)",
                                            style = MaterialTheme.typography.bodySmall.copy(
                                                color = if (completedCount == totalCount && totalCount > 0) Emerald400 else Slate400,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp
                                            )
                                        )
                                    }

                                    // Progress Bar
                                    LinearProgressIndicator(
                                        progress = { progressPercent },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(4.dp)
                                            .clip(RoundedCornerShape(2.dp)),
                                        color = if (completedCount == totalCount && totalCount > 0) Emerald500 else Cyan400,
                                        trackColor = Slate800,
                                    )

                                    Spacer(modifier = Modifier.height(2.dp))

                                    // Checkbox List Items
                                    checklistItems.forEach { item ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clip(RoundedCornerShape(6.dp))
                                                .clickable {
                                                    viewModel.toggleChecklistItem(task.id, item.id, !item.completed)
                                                }
                                                .padding(vertical = 3.dp, horizontal = 2.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Checkbox(
                                                checked = item.completed,
                                                onCheckedChange = { isChecked ->
                                                    viewModel.toggleChecklistItem(task.id, item.id, isChecked)
                                                },
                                                colors = CheckboxDefaults.colors(
                                                    checkedColor = Emerald500,
                                                    uncheckedColor = Slate500,
                                                    checkmarkColor = Slate950
                                                ),
                                                modifier = Modifier.size(20.dp)
                                            )
                                            Text(
                                                text = item.title,
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    color = if (item.completed) Slate500 else Slate200,
                                                    textDecoration = if (item.completed) TextDecoration.LineThrough else TextDecoration.None,
                                                    fontSize = 13.sp
                                                ),
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                    }
                                }
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
