package com.shohoj.staff.ui.components

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.BackgroundPermissionHelper

@Composable
fun BackgroundPermissionDialog(
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var isBatteryIgnored by remember { mutableStateOf(BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)) }
    var canExactAlarm by remember { mutableStateOf(BackgroundPermissionHelper.canScheduleExactAlarms(context)) }
    var isNotifGranted by remember { mutableStateOf(BackgroundPermissionHelper.isNotificationPermissionGranted(context)) }

    val brandName = remember { BackgroundPermissionHelper.getDeviceBrandDisplayName() }
    val autostartInstructions = remember { BackgroundPermissionHelper.getAutostartInstructions() }

    // Re-check permissions when returning to app
    LaunchedEffect(Unit) {
        isBatteryIgnored = BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)
        canExactAlarm = BackgroundPermissionHelper.canScheduleExactAlarms(context)
        isNotifGranted = BackgroundPermissionHelper.isNotificationPermissionGranted(context)
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(dismissOnBackPress = true, dismissOnClickOutside = false, usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .clip(RoundedCornerShape(24.dp))
                .background(Slate900)
                .border(1.dp, CardBorder, RoundedCornerShape(24.dp))
                .padding(22.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(
                                brush = Brush.radialGradient(listOf(Emerald400, Emerald600))
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = null,
                            tint = Slate950,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Background Permissions",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate50,
                                fontSize = 18.sp
                            )
                        )
                        Text(
                            text = "For instant notifications when app is closed",
                            style = MaterialTheme.typography.bodySmall.copy(color = Slate400)
                        )
                    }
                }

                Text(
                    text = "Android battery savers may pause Shohoj Staff in the background. Grant the following permissions to ensure you never miss new tasks, announcements, or chat messages:",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Slate300,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )
                )

                // Item 1: Battery Optimization Exemption
                PermissionItemCard(
                    title = "Battery Optimization",
                    description = if (isBatteryIgnored) "Unrestricted background running is enabled" else "Allow Shohoj Staff to run without battery restriction",
                    icon = Icons.Default.BatteryChargingFull,
                    isGranted = isBatteryIgnored,
                    actionText = "Disable Restriction",
                    onAction = {
                        BackgroundPermissionHelper.requestIgnoreBatteryOptimization(context)
                        // Trigger immediate state refresh
                        isBatteryIgnored = BackgroundPermissionHelper.isIgnoringBatteryOptimizations(context)
                    }
                )

                // Item 2: Exact Alarms (Android 12+)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                    PermissionItemCard(
                        title = "Exact Alarms & Timers",
                        description = if (canExactAlarm) "Exact background sync alarms are enabled" else "Required to trigger precise 30s background sync wakeups",
                        icon = Icons.Default.Alarm,
                        isGranted = canExactAlarm,
                        actionText = "Allow Exact Alarms",
                        onAction = {
                            BackgroundPermissionHelper.requestExactAlarmPermission(context)
                            canExactAlarm = BackgroundPermissionHelper.canScheduleExactAlarms(context)
                        }
                    )
                }

                // Item 3: OEM Autostart (Xiaomi / Samsung / Vivo / Oppo / etc.)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate800.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                        .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
                        .padding(14.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
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
                                    imageVector = Icons.Default.PhonelinkSetup,
                                    contentDescription = null,
                                    tint = Cyan400,
                                    modifier = Modifier.size(20.dp)
                                )
                                Text(
                                    text = "$brandName Autostart",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.SemiBold,
                                        color = Slate100,
                                        fontSize = 14.sp
                                    )
                                )
                            }
                        }

                        Text(
                            text = autostartInstructions,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate400,
                                fontSize = 11.5.sp,
                                lineHeight = 16.sp
                            )
                        )

                        Button(
                            onClick = {
                                BackgroundPermissionHelper.openAutostartSettings(context)
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Slate700,
                                contentColor = Cyan400
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(36.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Open $brandName Settings", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                // Confirm / Dismiss Action
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Emerald500,
                        contentColor = Slate950
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp)
                ) {
                    Text(
                        text = "I've Configured Background Run",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun PermissionItemCard(
    title: String,
    description: String,
    icon: ImageVector,
    isGranted: Boolean,
    actionText: String,
    onAction: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Slate800.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
            .border(
                1.dp,
                if (isGranted) Emerald500.copy(alpha = 0.3f) else Amber500.copy(alpha = 0.3f),
                RoundedCornerShape(14.dp)
            )
            .padding(14.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
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
                        tint = if (isGranted) Emerald400 else Amber400,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = Slate100,
                            fontSize = 14.sp
                        )
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (isGranted) Emerald500.copy(alpha = 0.15f) else Amber500.copy(alpha = 0.15f),
                    border = BorderStroke(
                        1.dp,
                        if (isGranted) Emerald500.copy(alpha = 0.4f) else Amber500.copy(alpha = 0.4f)
                    )
                ) {
                    Text(
                        text = if (isGranted) "GRANTED" else "RESTRICTED",
                        color = if (isGranted) Emerald400 else Amber400,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall.copy(color = Slate400, fontSize = 11.5.sp)
            )

            if (!isGranted) {
                Button(
                    onClick = onAction,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Amber500,
                        contentColor = Slate950
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(36.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(actionText, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
