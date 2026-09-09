package com.shohoj.staff.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.ui.components.ShohojBottomBar
import com.shohoj.staff.ui.components.ShohojTopBar
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils

@Composable
fun ProfileScreen(
    onNavigate: (String) -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isLoggedOut) {
        if (uiState.isLoggedOut) {
            onLogout()
        }
    }

    val empDto = uiState.employeeDto
    val detailed = uiState.profileDetails

    val displayName = detailed?.fullName ?: empDto?.displayName ?: "Employee"
    val designation = detailed?.effectiveDesignation ?: empDto?.designation ?: "Staff Member"
    val department = detailed?.effectiveDepartment ?: empDto?.department ?: "General"
    val email = detailed?.email ?: empDto?.email ?: "N/A"
    val phone = detailed?.phone ?: empDto?.phone ?: "N/A"
    val employeeId = detailed?.employeeId ?: empDto?.employeeId ?: "N/A"
    val joinDate = DateUtils.formatDate(detailed?.joinDate)

    val initials = displayName.split(" ")
        .mapNotNull { it.firstOrNull()?.toString() }
        .take(2)
        .joinToString("")
        .ifEmpty { "EM" }

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "My Profile",
                subtitle = employeeId
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Profile.route,
                onNavigate = onNavigate
            )
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Profile Header Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.linearGradient(listOf(Slate900, Slate800)),
                        shape = RoundedCornerShape(20.dp)
                    )
                    .border(1.dp, CardBorder, RoundedCornerShape(20.dp))
                    .padding(24.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Initials Avatar
                    Box(
                        modifier = Modifier
                            .size(68.dp)
                            .clip(CircleShape)
                            .background(
                                brush = Brush.radialGradient(listOf(Emerald400, Emerald600))
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials.uppercase(),
                            style = MaterialTheme.typography.headlineMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = Slate950,
                                fontSize = 24.sp
                            )
                        )
                    }

                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = displayName,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate50,
                                fontSize = 18.sp
                            )
                        )
                        Text(
                            text = designation,
                            style = MaterialTheme.typography.bodyMedium.copy(color = Emerald400, fontWeight = FontWeight.Medium)
                        )
                        Text(
                            text = "ID: $employeeId",
                            style = MaterialTheme.typography.labelSmall.copy(color = Slate400)
                        )
                    }
                }
            }

            // Information Section
            Text(
                text = "Contact & Employment",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(CardBackground, RoundedCornerShape(16.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    ProfileInfoRow(icon = Icons.Default.Email, label = "Email", value = email)
                    Divider(color = Slate700, thickness = 0.5.dp)
                    ProfileInfoRow(icon = Icons.Default.Phone, label = "Phone", value = phone)
                    Divider(color = Slate700, thickness = 0.5.dp)
                    ProfileInfoRow(icon = Icons.Default.Business, label = "Department", value = department)
                    Divider(color = Slate700, thickness = 0.5.dp)
                    ProfileInfoRow(icon = Icons.Default.CalendarToday, label = "Joined", value = joinDate)
                    if (detailed?.reportingManager != null) {
                        Divider(color = Slate700, thickness = 0.5.dp)
                        ProfileInfoRow(icon = Icons.Default.SupervisorAccount, label = "Manager", value = detailed.reportingManager.fullName)
                    }
                }
            }

            // System & App Details
            Text(
                text = "System Settings",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Slate50)
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(CardBackground, RoundedCornerShape(16.dp))
                    .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    ProfileInfoRow(icon = Icons.Default.Cloud, label = "API Server", value = uiState.serverUrl)
                    Divider(color = Slate700, thickness = 0.5.dp)
                    ProfileInfoRow(icon = Icons.Default.Info, label = "App Version", value = "v1.0.0 (Native Android Compose)")
                }
            }

            // Logout Action
            Button(
                onClick = { viewModel.showLogoutDialog(true) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Slate800,
                    contentColor = Rose400
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null, tint = Rose400, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Sign Out", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))
        }

        // Logout Confirmation Dialog
        if (uiState.showLogoutDialog) {
            AlertDialog(
                onDismissRequest = { viewModel.showLogoutDialog(false) },
                containerColor = Slate900,
                title = { Text("Sign Out", color = Slate50, fontWeight = FontWeight.Bold) },
                text = { Text("Are you sure you want to sign out from your employee account?", color = Slate300) },
                confirmButton = {
                    Button(
                        onClick = { viewModel.logout() },
                        colors = ButtonDefaults.buttonColors(containerColor = Rose500, contentColor = Slate50)
                    ) {
                        Text("Sign Out")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = { viewModel.showLogoutDialog(false) },
                        colors = ButtonDefaults.textButtonColors(contentColor = Slate400)
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun ProfileInfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Slate400,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 13.sp)
            )
        }
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium.copy(
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = Slate100
            )
        )
    }
}
