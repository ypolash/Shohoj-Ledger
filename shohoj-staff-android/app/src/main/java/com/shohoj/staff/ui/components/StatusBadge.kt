package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.*

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val upper = status.uppercase()

    val (bg, textColor, borderColor) = when {
        upper in listOf("PRESENT", "APPROVED", "COMPLETED", "PAID", "ACTIVE") ->
            Triple(Emerald500.copy(alpha = 0.15f), Emerald400, Emerald500.copy(alpha = 0.3f))
        upper in listOf("LATE", "IN PROGRESS", "PENDING", "WARNING", "HALF_DAY") ->
            Triple(Amber500.copy(alpha = 0.15f), Amber400, Amber500.copy(alpha = 0.3f))
        upper in listOf("ABSENT", "REJECTED", "BLOCKED", "UNPAID") ->
            Triple(Rose500.copy(alpha = 0.15f), Rose400, Rose500.copy(alpha = 0.3f))
        upper in listOf("WEEKLY_OFF", "HOLIDAY", "INFO") ->
            Triple(Cyan500.copy(alpha = 0.15f), Cyan400, Cyan500.copy(alpha = 0.3f))
        else ->
            Triple(Slate700.copy(alpha = 0.3f), Slate300, Slate600)
    }

    Box(
        modifier = modifier
            .background(color = bg, shape = RoundedCornerShape(20.dp))
            .border(width = 1.dp, color = borderColor, shape = RoundedCornerShape(20.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = status.replace("_", " "),
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.SemiBold,
                fontSize = 11.sp,
                color = textColor
            )
        )
    }
}
