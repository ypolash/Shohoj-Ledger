package com.shohoj.admin.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import com.shohoj.admin.data.repository.AdminRepository
import com.shohoj.admin.ui.components.*
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*

@Composable
fun SettingsScreen(
    repository: AdminRepository,
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit
) {
    val session = repository.sessionManager
    val user = session.getUser()
    val company = session.getCompany()
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showServerDialog by remember { mutableStateOf(false) }
    var currentUrl by remember { mutableStateOf(session.baseUrl) }

    if (showServerDialog) {
        ServerConfigDialog(
            currentUrl = currentUrl,
            onDismiss = { showServerDialog = false },
            onSave = { newUrl ->
                session.baseUrl = newUrl
                currentUrl = session.baseUrl
                showServerDialog = false
            }
        )
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Sign Out", color = Slate50) },
            text = { Text("Are you sure you want to sign out from the Admin App?", color = Slate300) },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        repository.logout()
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                ) {
                    Text("Sign Out")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = Slate400)
                }
            },
            containerColor = Slate900
        )
    }

    Scaffold(
        topBar = {
            ExecutiveTopBar(
                title = "Settings & Profile",
                subtitle = "Admin Account & Server",
                showBack = true,
                onBack = { onNavigate(Screen.Dashboard.route) }
            )
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Owner Profile Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(containerColor = CardBackground)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(Indigo500.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (user?.name?.take(2) ?: "AD").uppercase(),
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = Indigo500
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = user?.name ?: "Owner",
                        style = MaterialTheme.typography.titleLarge,
                        color = Slate50
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = user?.email ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Slate400
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(Indigo500.copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "${user?.role ?: "Owner"} • Administrator",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = Indigo500
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Company Info Section
            Text("Company Context", style = MaterialTheme.typography.titleMedium, color = Slate200)
            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = Slate900)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    SettingInfoRow(icon = Icons.Default.Business, label = "Company Name", value = company?.name ?: "Shohoj CRM")
                    SettingInfoRow(icon = Icons.Default.Category, label = "Business Type", value = company?.businessType ?: "General")
                    SettingInfoRow(icon = Icons.Default.Fingerprint, label = "Company ID", value = company?.id?.take(18) ?: "N/A")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Server Configuration Section
            Text("API Environment", style = MaterialTheme.typography.titleMedium, color = Slate200)
            Spacer(modifier = Modifier.height(8.dp))

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                    .clickable { showServerDialog = true },
                colors = CardDefaults.cardColors(containerColor = Slate900)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
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
                            Icon(Icons.Default.Cloud, contentDescription = null, tint = Slate300, modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Backend Server", style = MaterialTheme.typography.titleMedium, color = Slate100)
                            Text(currentUrl, style = MaterialTheme.typography.labelSmall, color = Slate400)
                        }
                    }
                    Icon(Icons.Default.ChevronRight, contentDescription = "Edit", tint = Slate500)
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Sign Out Button
            Button(
                onClick = { showLogoutDialog = true },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Rose500.copy(alpha = 0.2f))
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = Rose400, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Rose400)
            }
        }
    }
}

@Composable
private fun SettingInfoRow(
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
