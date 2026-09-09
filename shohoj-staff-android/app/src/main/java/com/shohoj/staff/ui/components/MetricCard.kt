package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.*

@Composable
fun MetricCard(
    title: String,
    value: String,
    icon: ImageVector,
    iconTint: Color = Emerald500,
    modifier: Modifier = Modifier,
    subtitle: String? = null
) {
    Box(
        modifier = modifier
            .background(color = CardBackground, shape = RoundedCornerShape(14.dp))
            .border(width = 1.dp, color = CardBorder, shape = RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Slate400,
                        fontSize = 12.sp
                    )
                )
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(color = iconTint.copy(alpha = 0.15f), shape = RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = Slate50
                )
            )
            if (!subtitle.isNullOrBlank()) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall.copy(
                        color = Slate400,
                        fontSize = 11.sp
                    )
                )
            }
        }
    }
}
