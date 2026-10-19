package com.shohoj.staff.ui.components

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.BreakManager
import kotlin.math.roundToInt

@Composable
fun ChatHeadBreakTimer(
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val breakState by BreakManager.state.collectAsState()

    if (!breakState.isBreakActive) return

    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
    val screenHeightPx = with(density) { configuration.screenHeightDp.dp.toPx() }

    // Vertical drag position along the left edge
    var offsetY by remember { mutableStateOf(with(density) { 220.dp.toPx() }) }
    var isExpanded by remember { mutableStateOf(false) }

    // Subtle pulsing animation for active countdown
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    val activeColor = when (breakState.statusColor) {
        "ROSE" -> Rose500
        "AMBER" -> Amber500
        else -> Emerald400
    }

    // 1. COMPACT CHAT HEAD (Positioned on the Left Edge of the app)
    Box(
        modifier = modifier
            .fillMaxSize()
    ) {
        Box(
            modifier = Modifier
                .offset { IntOffset(x = with(density) { 12.dp.toPx() }.roundToInt(), y = offsetY.roundToInt()) }
                .pointerInput(Unit) {
                    detectVerticalDragGestures { change, dragAmount ->
                        change.consume()
                        val newY = offsetY + dragAmount
                        val minY = 100f
                        val maxY = screenHeightPx - 260f
                        offsetY = newY.coerceIn(minY, maxY)
                    }
                }
                .clickable { isExpanded = true }
        ) {
            // Main Pill: Chat Head Avatar + Counting Digits Badge
            Surface(
                shape = RoundedCornerShape(26.dp),
                color = Slate950.copy(alpha = 0.94f),
                border = BorderStroke(
                    width = 2.dp,
                    brush = Brush.horizontalGradient(
                        listOf(activeColor, activeColor.copy(alpha = 0.6f))
                    )
                ),
                shadowElevation = 10.dp,
                modifier = Modifier
                    .wrapContentWidth()
                    .height(52.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(start = 5.dp, end = 14.dp, top = 4.dp, bottom = 4.dp)
                ) {
                    // Circular Head Icon
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(activeColor.copy(alpha = 0.25f), Slate900)
                                )
                            )
                            .border(1.dp, activeColor.copy(alpha = 0.5f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (breakState.isPaused) Icons.Default.Pause else Icons.Default.Restaurant,
                            contentDescription = "Break Chat Head",
                            tint = activeColor,
                            modifier = Modifier
                                .size(22.dp)
                                .scale(if (breakState.isPaused) 1f else pulseScale)
                        )
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Counting Timer Digits
                    Column(
                        verticalArrangement = Arrangement.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = breakState.countdownText.ifEmpty { "00:00" },
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    letterSpacing = 1.sp,
                                    color = if (breakState.statusColor == "ROSE") Rose400 else Slate50
                                )
                            )
                            // Mini pulsating indicator dot
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(activeColor)
                            )
                        }

                        // Status pill / Wi-Fi short text
                        Text(
                            text = if (breakState.isWifiAllowed) "Office Wi-Fi ✓" else "Outside Wi-Fi ⚠️",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (breakState.isWifiAllowed) Emerald400 else Amber400
                            )
                        )
                    }
                }
            }

            // Mini Wi-Fi Status Dot on top-left of the chat head
            Box(
                modifier = Modifier
                    .offset(x = (-2).dp, y = (-2).dp)
                    .size(14.dp)
                    .clip(CircleShape)
                    .background(if (breakState.isWifiAllowed) Emerald500 else Rose500)
                    .border(2.dp, Slate950, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
        }
    }

    // 2. EXPANDED MODAL (Opens when the left-side Chat Head is clicked)
    if (isExpanded) {
        Dialog(
            onDismissRequest = { isExpanded = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.65f))
                    .clickable { isExpanded = false },
                contentAlignment = Alignment.Center
            ) {
                Surface(
                    shape = RoundedCornerShape(24.dp),
                    color = Slate900,
                    border = BorderStroke(1.5.dp, activeColor.copy(alpha = 0.7f)),
                    shadowElevation = 18.dp,
                    modifier = Modifier
                        .fillMaxWidth(0.92f)
                        .clickable(enabled = false) {}
                        .padding(vertical = 12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Header: Title & Close Button
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(activeColor.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Restaurant,
                                        contentDescription = null,
                                        tint = activeColor,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = breakState.activeBreak?.type ?: "Short Break",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            color = Slate50,
                                            fontSize = 16.sp
                                        )
                                    )
                                    Text(
                                        text = breakState.statusText,
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            color = activeColor,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    )
                                }
                            }

                            IconButton(
                                onClick = { isExpanded = false },
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(Slate800, CircleShape)
                            ) {
                                Icon(
                                    Icons.Default.Close,
                                    contentDescription = "Minimize",
                                    tint = Slate400,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        // Big Live Countdown Box
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    brush = Brush.verticalGradient(
                                        listOf(Slate800.copy(alpha = 0.7f), Slate950)
                                    ),
                                    shape = RoundedCornerShape(18.dp)
                                )
                                .border(1.dp, Slate700, RoundedCornerShape(18.dp))
                                .padding(vertical = 18.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = breakState.countdownText.ifEmpty { "00:00" },
                                    style = MaterialTheme.typography.headlineLarge.copy(
                                        fontSize = 42.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 2.sp,
                                        color = if (breakState.statusColor == "ROSE") Rose400 else Slate50
                                    )
                                )
                                Text(
                                    text = if (breakState.isOverstayed) "Overstay Countdown" else "Break Time Remaining",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Slate400,
                                        fontSize = 12.sp
                                    )
                                )
                            }
                        }

                        // WI-FI VALIDATION STATUS CARD (Critical for requirement #2)
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    color = if (breakState.isWifiAllowed) Color(0xFF022C22).copy(alpha = 0.4f) else Color(0xFF450A0A).copy(alpha = 0.4f),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                .border(
                                    width = 1.dp,
                                    color = if (breakState.isWifiAllowed) Emerald500.copy(alpha = 0.4f) else Rose500.copy(alpha = 0.5f),
                                    shape = RoundedCornerShape(14.dp)
                                )
                                .padding(12.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Icon(
                                    imageVector = if (breakState.isWifiAllowed) Icons.Default.Wifi else Icons.Default.WifiOff,
                                    contentDescription = null,
                                    tint = if (breakState.isWifiAllowed) Emerald400 else Rose400,
                                    modifier = Modifier.size(22.dp)
                                )
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    Text(
                                        text = if (breakState.isWifiAllowed) "Connected to Authorized Office Wi-Fi" else "Outside Office Wi-Fi Network",
                                        fontWeight = FontWeight.Bold,
                                        color = if (breakState.isWifiAllowed) Emerald300 else Rose300,
                                        fontSize = 13.sp
                                    )
                                    val ssidText = breakState.currentSsid?.let { "Connected to: \"$it\"" } ?: "No Wi-Fi Connection"
                                    Text(
                                        text = if (breakState.isWifiAllowed) {
                                            "$ssidText • Safe to complete your break."
                                        } else {
                                            "$ssidText • ⚠️ You must reconnect to office Wi-Fi before your timer expires to avoid fine."
                                        },
                                        color = Slate300,
                                        fontSize = 11.5.sp,
                                        lineHeight = 15.sp
                                    )
                                }
                            }
                        }

                        // Fine warning / notice if applicable
                        if (breakState.fineText != null) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(activeColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                                    .border(1.dp, activeColor.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                    .padding(vertical = 8.dp, horizontal = 12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Default.WarningAmber,
                                        contentDescription = null,
                                        tint = activeColor,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text(
                                        text = breakState.fineText!!,
                                        color = activeColor,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        // Action Buttons: End Break & Pause / Resume
                        if (breakState.isTimerFinished) {
                            // When timer is finished, Pause is removed and End Break is prominent
                            Button(
                                onClick = {
                                    BreakManager.endBreak(
                                        context = context,
                                        onSuccess = { msg ->
                                            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                            isExpanded = false
                                        },
                                        onError = { err ->
                                            Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                        }
                                    )
                                },
                                enabled = !breakState.isActionLoading,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.Transparent,
                                    contentColor = Color.White
                                ),
                                shape = RoundedCornerShape(14.dp),
                                contentPadding = PaddingValues(),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(48.dp)
                                    .background(
                                        brush = Brush.horizontalGradient(
                                            listOf(Color(0xFFDC2626), Color(0xFF991B1B))
                                        ),
                                        shape = RoundedCornerShape(14.dp)
                                    )
                            ) {
                                if (breakState.isActionLoading) {
                                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                                } else {
                                    Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "End Lunch Break (Verify Wi-Fi)",
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        } else {
                            // When timer is still counting: Pause/Resume + End Break
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                if (breakState.isPaused) {
                                    Button(
                                        onClick = {
                                            BreakManager.resumeBreak(
                                                context = context,
                                                onSuccess = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() },
                                                onError = { Toast.makeText(context, it, Toast.LENGTH_LONG).show() }
                                            )
                                        },
                                        enabled = !breakState.isActionLoading,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Emerald500,
                                            contentColor = Slate950
                                        ),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.weight(1f).height(46.dp)
                                    ) {
                                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Resume", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                } else {
                                    Button(
                                        onClick = {
                                            BreakManager.pauseBreak(
                                                context = context,
                                                onSuccess = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() },
                                                onError = { Toast.makeText(context, it, Toast.LENGTH_LONG).show() }
                                            )
                                        },
                                        enabled = !breakState.isActionLoading,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Slate800,
                                            contentColor = Amber400
                                        ),
                                        border = BorderStroke(1.dp, Amber500.copy(alpha = 0.5f)),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.weight(1f).height(46.dp)
                                    ) {
                                        Icon(Icons.Default.Pause, contentDescription = null, modifier = Modifier.size(18.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Pause", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }

                                Button(
                                    onClick = {
                                        BreakManager.endBreak(
                                            context = context,
                                            onSuccess = { msg ->
                                                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                                                isExpanded = false
                                            },
                                            onError = { err ->
                                                Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                            }
                                        )
                                    },
                                    enabled = !breakState.isActionLoading,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Rose500.copy(alpha = 0.2f),
                                        contentColor = Rose400
                                    ),
                                    border = BorderStroke(1.dp, Rose500.copy(alpha = 0.4f)),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.weight(1f).height(46.dp)
                                ) {
                                    Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("End Break", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                        }

                        // Close Dialog Button
                        OutlinedButton(
                            onClick = { isExpanded = false },
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, Slate700),
                            modifier = Modifier.fillMaxWidth().height(42.dp)
                        ) {
                            Text("Minimize to Left Side", color = Slate400, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}
