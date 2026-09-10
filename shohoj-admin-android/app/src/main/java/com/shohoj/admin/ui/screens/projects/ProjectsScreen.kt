package com.shohoj.admin.ui.screens.projects

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
import com.shohoj.admin.data.model.ProjectItem
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectsScreen(
    viewModel: ProjectsViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormat = remember { NumberFormat.getNumberInstance(Locale.US) }

    // Project Detail Bottom Sheet
    if (state.selectedProject != null) {
        val proj = state.selectedProject!!
        ModalBottomSheet(
            onDismissRequest = { viewModel.selectProject(null) },
            containerColor = Slate900,
            dragHandle = { BottomSheetDefaults.DragHandle(color = Slate600) }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Indigo500.copy(alpha = 0.2f))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = proj.projectCode,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = Indigo500
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = proj.name,
                            style = MaterialTheme.typography.titleLarge,
                            color = Slate50
                        )
                    }
                    StatusBadge(status = proj.status)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Progress Bar
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Progress", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        Text("${proj.progress}%", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Slate200)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    LinearProgressIndicator(
                        progress = proj.progress / 100f,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape),
                        color = if (proj.progress >= 100) Emerald500 else Indigo500,
                        trackColor = Slate800
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))
                HorizontalDivider(color = Slate800)
                Spacer(modifier = Modifier.height(16.dp))

                // Project Details
                ProjectDetailRow(icon = Icons.Default.Business, label = "Client / Company", value = proj.companyName)
                if (!proj.clientContact.isNullOrBlank()) {
                    ProjectDetailRow(icon = Icons.Default.Person, label = "Contact Person", value = proj.clientContact)
                }
                ProjectDetailRow(
                    icon = Icons.Default.Payments,
                    label = "Project Budget",
                    value = "৳ ${currencyFormat.format(proj.budget)}"
                )
                ProjectDetailRow(
                    icon = Icons.Default.SupervisorAccount,
                    label = "Project Manager",
                    value = proj.managerName
                )
                ProjectDetailRow(
                    icon = Icons.Default.DateRange,
                    label = "Timeline",
                    value = "${proj.startDate?.take(10) ?: "TBD"} → ${proj.endDate?.take(10) ?: "TBD"}"
                )
                ProjectDetailRow(
                    icon = Icons.Default.Assignment,
                    label = "Tasks",
                    value = "${proj.completedTasks} / ${proj.totalTasks} Completed"
                )

                if (proj.description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Description", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = proj.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate300
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = "Projects Overview",
                subtitle = "${state.projects.size} Active & Delivered Projects",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Projects.route,
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

            // Search by Company Name or Project Code
            SearchBarField(
                query = state.searchQuery,
                onQueryChange = { viewModel.onSearchChange(it) },
                placeholder = "Search by company name or project code..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Status Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf("ALL", "PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED")
                items(filters) { status ->
                    val isSelected = state.selectedStatus == status
                    FilterChip(
                        selected = isSelected,
                        onClick = { viewModel.onStatusFilterChange(status) },
                        label = {
                            Text(
                                text = status.replace("_", " "),
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

            // Project List
            if (state.isLoading) {
                LoadingState()
            } else if (state.projects.isEmpty()) {
                EmptyState(
                    message = if (state.searchQuery.isNotEmpty())
                        "No project matching \"${state.searchQuery}\""
                    else
                        "No projects found in CRM.",
                    icon = Icons.Default.WorkOff
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(state.projects) { proj ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                .clickable { viewModel.selectProject(proj) },
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(Indigo500.copy(alpha = 0.2f))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = proj.projectCode,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = Indigo500
                                        )
                                    }
                                    StatusBadge(status = proj.status)
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                Text(
                                    text = proj.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    color = Slate50
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Business,
                                        contentDescription = null,
                                        tint = Slate400,
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = proj.companyName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = Slate300
                                    )
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // Progress Bar
                                LinearProgressIndicator(
                                    progress = proj.progress / 100f,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(6.dp)
                                        .clip(CircleShape),
                                    color = if (proj.progress >= 100) Emerald500 else Indigo500,
                                    trackColor = Slate800
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "${proj.progress}% Complete",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Slate400
                                    )
                                    Text(
                                        text = "৳ ${currencyFormat.format(proj.budget)}",
                                        style = MaterialTheme.typography.labelLarge,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate100
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
private fun ProjectDetailRow(
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
