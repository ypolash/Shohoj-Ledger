package com.shohoj.staff.ui.screens.login

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    var passwordVisible by remember { mutableStateOf(false) }
    var tempUrl by remember(uiState.serverUrl) { mutableStateOf(uiState.serverUrl) }

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) {
            onLoginSuccess()
        }
    }

    Scaffold(
        containerColor = Slate950
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Brand Header Icon
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(
                            brush = Brush.radialGradient(
                                listOf(Emerald400, Emerald600)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Business,
                        contentDescription = null,
                        tint = Slate950,
                        modifier = Modifier.size(44.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = "Shohoj Staff",
                    style = MaterialTheme.typography.headlineLarge.copy(
                        fontSize = 30.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Slate50
                    )
                )

                Text(
                    text = "Employee Self Service Portal",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Slate400,
                        fontSize = 14.sp
                    )
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Login Form Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(color = CardBackground, shape = RoundedCornerShape(20.dp))
                        .border(width = 1.dp, color = CardBorder, shape = RoundedCornerShape(20.dp))
                        .padding(24.dp)
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Error Banner
                        if (uiState.error != null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Rose500.copy(alpha = 0.15f), shape = RoundedCornerShape(10.dp))
                                    .border(1.dp, Rose500.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                    .padding(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.ErrorOutline,
                                        contentDescription = null,
                                        tint = Rose400,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = uiState.error!!,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = Rose400,
                                            fontSize = 13.sp
                                        )
                                    )
                                }
                            }
                        }

                        // Employee ID Input
                        OutlinedTextField(
                            value = uiState.employeeId,
                            onValueChange = { viewModel.onEmployeeIdChange(it) },
                            label = { Text("Employee ID") },
                            placeholder = { Text("EMP-1001", color = Slate500) },
                            leadingIcon = {
                                Icon(Icons.Default.Badge, contentDescription = null, tint = Emerald400)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            keyboardActions = KeyboardActions(
                                onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate700,
                                focusedLabelColor = Emerald400,
                                unfocusedLabelColor = Slate400,
                                focusedTextColor = Slate50,
                                unfocusedTextColor = Slate50,
                                cursorColor = Emerald500
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Password Input
                        OutlinedTextField(
                            value = uiState.password,
                            onValueChange = { viewModel.onPasswordChange(it) },
                            label = { Text("Password") },
                            placeholder = { Text("••••••••", color = Slate500) },
                            leadingIcon = {
                                Icon(Icons.Default.Lock, contentDescription = null, tint = Emerald400)
                            },
                            trailingIcon = {
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                        contentDescription = "Toggle password visibility",
                                        tint = Slate400
                                    )
                                }
                            },
                            singleLine = true,
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    viewModel.login()
                                }
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Emerald500,
                                unfocusedBorderColor = Slate700,
                                focusedLabelColor = Emerald400,
                                unfocusedLabelColor = Slate400,
                                focusedTextColor = Slate50,
                                unfocusedTextColor = Slate50,
                                cursorColor = Emerald500
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        // Login Button
                        Button(
                            onClick = {
                                focusManager.clearFocus()
                                viewModel.login()
                            },
                            enabled = !uiState.isLoading,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Emerald500,
                                contentColor = Slate950,
                                disabledContainerColor = Emerald700.copy(alpha = 0.5f),
                                disabledContentColor = Slate400
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            if (uiState.isLoading) {
                                CircularProgressIndicator(
                                    color = Slate950,
                                    strokeWidth = 2.5.dp,
                                    modifier = Modifier.size(22.dp)
                                )
                            } else {
                                Text(
                                    text = "Sign In",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Server Environment Indicator & Switcher Button
                val isLive = uiState.serverUrl.trimEnd('/') == SessionManager.LIVE_BASE_URL.trimEnd('/')
                val isEmulator = uiState.serverUrl.trimEnd('/') == SessionManager.EMULATOR_BASE_URL.trimEnd('/')

                Surface(
                    onClick = { viewModel.showServerDialog(true) },
                    shape = RoundedCornerShape(20.dp),
                    color = Slate900.copy(alpha = 0.85f),
                    border = BorderStroke(1.dp, Slate800),
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(if (isLive) Emerald400 else if (isEmulator) Amber400 else Cyan400)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = when {
                                isLive -> "Live Server (team.shohojsolution.com)"
                                isEmulator -> "Dev (10.0.2.2:3000)"
                                else -> "Custom (${uiState.serverUrl.trimEnd('/')})"
                            },
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate300,
                                fontWeight = FontWeight.Medium,
                                fontSize = 12.sp
                            )
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Switch Server",
                            modifier = Modifier.size(13.dp),
                            tint = Slate500
                        )
                    }
                }
            }

            // Server URL Edit Dialog
            if (uiState.showServerDialog) {
                AlertDialog(
                    onDismissRequest = { viewModel.showServerDialog(false) },
                    containerColor = Slate900,
                    shape = RoundedCornerShape(16.dp),
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Cloud,
                                contentDescription = null,
                                tint = Emerald400,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = "Server Environment",
                                style = MaterialTheme.typography.titleLarge.copy(
                                    color = Slate50,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                        }
                    },
                    text = {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Text(
                                text = "Select a pre-configured server environment or specify a custom backend URL:",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontSize = 13.sp,
                                    color = Slate400
                                )
                            )

                            // Quick Presets
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                val isTempLive = tempUrl.trimEnd('/') == SessionManager.LIVE_BASE_URL.trimEnd('/')
                                val isTempEmulator = tempUrl.trimEnd('/') == SessionManager.EMULATOR_BASE_URL.trimEnd('/')

                                // Preset 1: Live Production Server
                                Surface(
                                    onClick = { tempUrl = SessionManager.LIVE_BASE_URL },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (isTempLive) Emerald700.copy(alpha = 0.25f) else Slate800.copy(alpha = 0.6f),
                                    border = BorderStroke(
                                        width = if (isTempLive) 1.5.dp else 1.dp,
                                        color = if (isTempLive) Emerald400 else Slate700
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(Emerald400)
                                        )
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "🟢 Live Production Server",
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = Slate100
                                                )
                                            )
                                            Text(
                                                text = SessionManager.LIVE_BASE_URL,
                                                style = MaterialTheme.typography.bodySmall.copy(
                                                    color = Slate400,
                                                    fontSize = 11.sp
                                                )
                                            )
                                        }
                                        if (isTempLive) {
                                            Icon(
                                                imageVector = Icons.Default.CheckCircle,
                                                contentDescription = "Selected",
                                                tint = Emerald400,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }

                                // Preset 2: Localhost Emulator
                                Surface(
                                    onClick = { tempUrl = SessionManager.EMULATOR_BASE_URL },
                                    shape = RoundedCornerShape(10.dp),
                                    color = if (isTempEmulator) Emerald700.copy(alpha = 0.25f) else Slate800.copy(alpha = 0.6f),
                                    border = BorderStroke(
                                        width = if (isTempEmulator) 1.5.dp else 1.dp,
                                        color = if (isTempEmulator) Emerald400 else Slate700
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(10.dp)
                                                .clip(CircleShape)
                                                .background(Amber400)
                                        )
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "💻 Android Emulator Localhost",
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = Slate100
                                                )
                                            )
                                            Text(
                                                text = SessionManager.EMULATOR_BASE_URL,
                                                style = MaterialTheme.typography.bodySmall.copy(
                                                    color = Slate400,
                                                    fontSize = 11.sp
                                                )
                                            )
                                        }
                                        if (isTempEmulator) {
                                            Icon(
                                                imageVector = Icons.Default.CheckCircle,
                                                contentDescription = "Selected",
                                                tint = Emerald400,
                                                modifier = Modifier.size(20.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            // Custom URL Input
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "Custom / LAN Server URL:",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Slate300,
                                        fontWeight = FontWeight.Medium
                                    )
                                )
                                OutlinedTextField(
                                    value = tempUrl,
                                    onValueChange = { tempUrl = it },
                                    singleLine = true,
                                    textStyle = MaterialTheme.typography.bodyMedium.copy(
                                        color = Slate50,
                                        fontSize = 13.sp
                                    ),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Emerald500,
                                        unfocusedBorderColor = Slate700,
                                        focusedTextColor = Slate50,
                                        unfocusedTextColor = Slate50
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.fillMaxWidth()
                                )
                                Text(
                                    text = "Tip: For physical phone on Wi-Fi, use http://192.168.1.XX:3000/",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontSize = 11.sp,
                                        color = Slate500
                                    )
                                )
                            }
                        }
                    },
                    confirmButton = {
                        Button(
                            onClick = { viewModel.updateServerUrl(tempUrl) },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Apply & Save", fontWeight = FontWeight.Bold)
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { viewModel.showServerDialog(false) },
                            colors = ButtonDefaults.textButtonColors(contentColor = Slate400)
                        ) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}
