package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.*

@Composable
fun ShohojTopBar(
    title: String,
    subtitle: String? = null,
    onNotificationsClick: (() -> Unit)? = null,
    actions: @Composable (RowScope.() -> Unit)? = null,
    contentBelow: @Composable (() -> Unit)? = null
) {
    Surface(
        color = Color.Transparent,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Slate900,
                            Slate950
                        )
                    )
                )
                .statusBarsPadding()
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.weight(1f, fill = false)
                    ) {
                        ShohojStaffLogo(
                            size = 38.dp,
                            showGlow = true
                        )
                        Column(verticalArrangement = Arrangement.Center) {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Slate50,
                                    letterSpacing = (-0.2).sp
                                ),
                                maxLines = 1
                            )
                            if (!subtitle.isNullOrBlank()) {
                                Text(
                                    text = subtitle,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        fontSize = 12.sp,
                                        color = Slate400,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    maxLines = 1
                                )
                            }
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (actions != null) {
                            actions()
                        }
                        if (onNotificationsClick != null) {
                            IconButton(
                                onClick = onNotificationsClick,
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Slate800.copy(alpha = 0.6f))
                                    .border(1.dp, Slate700.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Notifications,
                                    contentDescription = "Notifications",
                                    tint = Emerald400,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }

                // Optional header expansion / tabs slot
                if (contentBelow != null) {
                    contentBelow()
                }

                // Subtle glowing bottom divider line
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    Color.Transparent,
                                    Emerald500.copy(alpha = 0.35f),
                                    Cyan500.copy(alpha = 0.25f),
                                    Color.Transparent
                                )
                            )
                        )
                )
            }
        }
    }
}
