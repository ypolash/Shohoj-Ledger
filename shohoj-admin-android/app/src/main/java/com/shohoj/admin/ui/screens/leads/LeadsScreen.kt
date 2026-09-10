package com.shohoj.admin.ui.screens.leads

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
import com.shohoj.admin.data.model.LeadItem
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeadsScreen(
    viewModel: LeadsViewModel,
    onNavigate: (String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val currencyFormat = remember { NumberFormat.getNumberInstance(Locale.US) }

    // Lead Detail Bottom Sheet
    if (state.selectedLead != null) {
        val lead = state.selectedLead!!
        ModalBottomSheet(
            onDismissRequest = { viewModel.selectLead(null) },
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
                            text = lead.companyName,
                            style = MaterialTheme.typography.titleLarge,
                            color = Slate50
                        )
                        Text(
                            text = "Contact: ${lead.contactPerson}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate400
                        )
                    }
                    StatusBadge(status = lead.status)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Deal Value Highlight Box
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp)),
                    colors = CardDefaults.cardColors(containerColor = Slate800)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Estimated Value", style = MaterialTheme.typography.labelMedium, color = Slate300)
                        Text(
                            text = "৳ ${currencyFormat.format(lead.estimatedValue)}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Emerald400
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Slate800)
                Spacer(modifier = Modifier.height(16.dp))

                LeadDetailRow(icon = Icons.Default.Email, label = "Email", value = lead.email.ifBlank { "Not provided" })
                LeadDetailRow(icon = Icons.Default.Phone, label = "Phone", value = lead.phone.ifBlank { "Not provided" })
                LeadDetailRow(icon = Icons.Default.Category, label = "Service Type", value = lead.serviceType)
                LeadDetailRow(icon = Icons.Default.Source, label = "Lead Source", value = lead.leadSource)
                LeadDetailRow(icon = Icons.Default.Flag, label = "Priority", value = lead.priority)
                LeadDetailRow(icon = Icons.Default.Person, label = "Assigned Agent", value = lead.assignedTo)

                if (lead.notes.isNotBlank()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("Lead Notes", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = lead.notes,
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
                title = "CRM Lead Management",
                subtitle = "${state.leads.size} In Pipeline",
                onSettingsClick = { onNavigate(Screen.Settings.route) }
            )
        },
        bottomBar = {
            ExecutiveBottomBar(
                currentRoute = Screen.Leads.route,
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
                placeholder = "Search leads by company, contact, or email..."
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Pipeline Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                val filters = listOf("ALL", "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST")
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

            // Leads List
            if (state.isLoading) {
                LoadingState()
            } else if (state.leads.isEmpty()) {
                EmptyState(
                    message = if (state.searchQuery.isNotEmpty())
                        "No leads matching \"${state.searchQuery}\""
                    else
                        "No leads found in this stage.",
                    icon = Icons.Default.FilterAltOff
                )
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(state.leads) { lead ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                .clickable { viewModel.selectLead(lead) },
                            colors = CardDefaults.cardColors(containerColor = CardBackground)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = lead.companyName,
                                        style = MaterialTheme.typography.titleMedium,
                                        color = Slate50
                                    )
                                    StatusBadge(status = lead.status)
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = "Contact: ${lead.contactPerson}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Slate300
                                )

                                Spacer(modifier = Modifier.height(10.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Slate800)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = lead.serviceType,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Slate300
                                            )
                                        }
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(Slate800)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = lead.priority,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = when (lead.priority.uppercase()) {
                                                    "URGENT", "HIGH" -> Rose400
                                                    "MEDIUM" -> Amber400
                                                    else -> Slate400
                                                }
                                            )
                                        }
                                    }

                                    Text(
                                        text = "৳ ${currencyFormat.format(lead.estimatedValue)}",
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Emerald400
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
private fun LeadDetailRow(
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
