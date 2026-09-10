package com.shohoj.admin.ui.screens.login

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.admin.ui.components.ServerConfigDialog
import com.shohoj.admin.ui.theme.*

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var passwordVisible by remember { mutableStateOf(false) }

    if (state.showServerDialog) {
        ServerConfigDialog(
            currentUrl = state.currentServerUrl,
            onDismiss = { viewModel.closeServerDialog() },
            onSave = { viewModel.updateServerUrl(it) }
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // App Logo / Executive Emblem
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Indigo500, Violet500)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = Slate50,
                    modifier = Modifier.size(40.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "SHOHOJ ADMIN",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 1.sp,
                color = Slate50
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "CRM Owner & Executive Portal",
                style = MaterialTheme.typography.bodyMedium,
                color = Slate400
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Server Indicator Badge (Clickable)
            Row(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Slate900)
                    .border(1.dp, Slate800, CircleShape)
                    .clickable { viewModel.openServerDialog() }
                    .padding(horizontal = 14.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Emerald500)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = state.currentServerUrl.removePrefix("https://").removePrefix("http://").trimEnd('/'),
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate300
                )
                Spacer(modifier = Modifier.width(6.dp))
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Edit Server",
                    tint = Slate400,
                    modifier = Modifier.size(12.dp)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Error Banner
            if (state.errorMessage != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Rose500.copy(alpha = 0.15f))
                        .border(1.dp, Rose500.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                        .padding(14.dp)
                ) {
                    Text(
                        text = state.errorMessage!!,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Rose400,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                Spacer(modifier = Modifier.height(20.dp))
            }

            // Email Field
            OutlinedTextField(
                value = state.email,
                onValueChange = { viewModel.onEmailChange(it) },
                label = { Text("Owner Email") },
                placeholder = { Text("owner@company.com", color = Slate600) },
                leadingIcon = {
                    Icon(Icons.Default.Email, contentDescription = null, tint = Slate400)
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Slate900,
                    unfocusedContainerColor = Slate900,
                    focusedBorderColor = Indigo500,
                    unfocusedBorderColor = Slate800,
                    focusedTextColor = Slate50,
                    unfocusedTextColor = Slate100
                )
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Password Field
            OutlinedTextField(
                value = state.password,
                onValueChange = { viewModel.onPasswordChange(it) },
                label = { Text("Password") },
                placeholder = { Text("CRM Password", color = Slate600) },
                leadingIcon = {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = Slate400)
                },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                            contentDescription = if (passwordVisible) "Hide" else "Show",
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
                    onDone = { viewModel.login(onLoginSuccess) }
                ),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Slate900,
                    unfocusedContainerColor = Slate900,
                    focusedBorderColor = Indigo500,
                    unfocusedBorderColor = Slate800,
                    focusedTextColor = Slate50,
                    unfocusedTextColor = Slate100
                )
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Sign In Button
            Button(
                onClick = { viewModel.login(onLoginSuccess) },
                enabled = !state.isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Indigo500,
                    disabledContainerColor = Indigo500.copy(alpha = 0.5f)
                )
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        color = Slate50,
                        strokeWidth = 2.5.dp,
                        modifier = Modifier.size(22.dp)
                    )
                } else {
                    Text(
                        text = "Sign In as Owner",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Use the exact credentials you used to sign up for your CRM.",
                style = MaterialTheme.typography.labelSmall,
                color = Slate500,
                textAlign = TextAlign.Center
            )
        }
    }
}
