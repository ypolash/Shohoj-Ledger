package com.shohoj.admin.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.admin.ui.navigation.Screen
import com.shohoj.admin.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExecutiveTopBar(
    title: String,
    subtitle: String? = null,
    showBack: Boolean = false,
    onBack: (() -> Unit)? = null,
    onSettingsClick: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = Slate50,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (!subtitle.isNullOrBlank()) {
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate400,
                        maxLines = 1
                    )
                }
            }
        },
        navigationIcon = {
            if (showBack && onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Slate200
                    )
                }
            }
        },
        actions = {
            actions()
            if (onSettingsClick != null) {
                IconButton(onClick = onSettingsClick) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Settings",
                        tint = Slate300
                    )
                }
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Slate950
        )
    )
}

@Composable
fun ExecutiveBottomBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar(
        containerColor = Slate900,
        tonalElevation = 8.dp,
        modifier = Modifier.border(
            width = 1.dp,
            color = Slate800,
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
        )
    ) {
        Screen.bottomNavItems.forEach { screen ->
            val isSelected = currentRoute == screen.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(screen.route) },
                icon = {
                    screen.icon?.let { icon ->
                        Icon(
                            imageVector = icon,
                            contentDescription = screen.title,
                            tint = if (isSelected) Indigo500 else Slate400
                        )
                    }
                },
                label = {
                    Text(
                        text = screen.title,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        color = if (isSelected) Indigo500 else Slate400
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = LightGlassSurface,
                    selectedIconColor = Indigo500,
                    unselectedIconColor = Slate400
                )
            )
        }
    }
}

@Composable
fun ExecutiveMetricCard(
    title: String,
    value: String,
    subtitle: String? = null,
    icon: ImageVector,
    accentColor: Color = Indigo500,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
        colors = CardDefaults.cardColors(containerColor = CardBackground)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelLarge,
                    color = Slate300
                )
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Slate50
            )
            if (!subtitle.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate400
                )
            }
        }
    }
}

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor) = when (status.uppercase()) {
        "PRESENT", "ACTIVE", "WON", "APPROVED", "COMPLETED" ->
            Pair(Emerald500.copy(alpha = 0.18f), Emerald400)
        "LATE", "IN_PROGRESS", "QUALIFIED", "PENDING" ->
            Pair(Amber500.copy(alpha = 0.18f), Amber400)
        "ABSENT", "REJECTED", "LOST", "CANCELLED", "INACTIVE" ->
            Pair(Rose500.copy(alpha = 0.18f), Rose400)
        "HALF_DAY", "PROPOSAL", "ON_HOLD", "PLANNING" ->
            Pair(Sky400.copy(alpha = 0.18f), Sky400)
        "NEW", "CONTACTED" ->
            Pair(Indigo500.copy(alpha = 0.18f), Violet400)
        else ->
            Pair(Slate700, Slate300)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .padding(horizontal = 8.dp, vertical = 3.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = status.replace("_", " "),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = textColor
        )
    }
}

@Composable
fun SearchBarField(
    query: String,
    onQueryChange: (String) -> Unit,
    placeholder: String = "Search...",
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = { Text(placeholder, color = Slate500, fontSize = 14.sp) },
        leadingIcon = {
            Icon(Icons.Default.Search, contentDescription = "Search", tint = Slate400)
        },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(Icons.Default.Close, contentDescription = "Clear", tint = Slate400)
                }
            }
        },
        singleLine = true,
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp)),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = Slate900,
            unfocusedContainerColor = Slate900,
            focusedBorderColor = Indigo500,
            unfocusedBorderColor = Slate800,
            focusedTextColor = Slate50,
            unfocusedTextColor = Slate100
        )
    )
}

@Composable
fun LoadingState(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            color = Indigo500,
            strokeWidth = 3.dp
        )
    }
}

@Composable
fun EmptyState(
    message: String,
    icon: ImageVector = Icons.Default.Info,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Slate600,
            modifier = Modifier.size(56.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = Slate400,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun ServerConfigDialog(
    currentUrl: String,
    onDismiss: () -> Unit,
    onSave: (String) -> Unit
) {
    var urlText by remember { mutableStateOf(currentUrl) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("API Server Configuration", color = Slate50)
        },
        text = {
            Column {
                Text(
                    "Configure the CRM backend URL to connect this app to:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate300
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = urlText,
                    onValueChange = { urlText = it },
                    label = { Text("Base URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Indigo500,
                        unfocusedBorderColor = Slate700,
                        focusedTextColor = Slate50,
                        unfocusedTextColor = Slate100
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text("Quick Presets:", style = MaterialTheme.typography.labelSmall, color = Slate400)
                Spacer(modifier = Modifier.height(6.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { urlText = "https://team.shohojsolution.com/" },
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Live Server", fontSize = 11.sp, color = Slate200)
                    }
                    Button(
                        onClick = { urlText = "http://10.0.2.2:3000/" },
                        colors = ButtonDefaults.buttonColors(containerColor = Slate800),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Emulator", fontSize = 11.sp, color = Slate200)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onSave(urlText) },
                colors = ButtonDefaults.buttonColors(containerColor = Indigo500)
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        },
        containerColor = Slate900
    )
}
