package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.*

@Composable
fun ShohojTopBar(
    title: String,
    subtitle: String? = null,
    onNotificationsClick: (() -> Unit)? = null
) {
    Surface(
        color = Slate900,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(
                            brush = Brush.linearGradient(listOf(Emerald500, Cyan500)),
                            shape = MaterialTheme.shapes.small
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Business,
                        contentDescription = "Logo",
                        tint = Slate950,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    if (!subtitle.isNullOrBlank()) {
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontSize = 12.sp,
                                color = Slate400
                            )
                        )
                    }
                }
            }

            if (onNotificationsClick != null) {
                IconButton(onClick = onNotificationsClick) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = Slate300
                    )
                }
            }
        }
    }
}
