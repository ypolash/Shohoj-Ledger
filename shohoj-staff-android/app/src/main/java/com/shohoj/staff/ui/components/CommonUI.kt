package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ui.theme.*

@Composable
fun LoadingView(message: String = "Loading...") {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            CircularProgressIndicator(
                color = Emerald500,
                strokeWidth = 3.dp,
                modifier = Modifier.size(44.dp)
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium.copy(color = Slate400)
            )
        }
    }
}

@Composable
fun ErrorView(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp)
            .background(color = CardBackground, shape = RoundedCornerShape(16.dp))
            .border(width = 1.dp, color = Rose500.copy(alpha = 0.3f), shape = RoundedCornerShape(16.dp))
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.ErrorOutline,
                contentDescription = null,
                tint = Rose400,
                modifier = Modifier.size(36.dp)
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Slate300,
                    textAlign = TextAlign.Center
                )
            )
            Button(
                onClick = onRetry,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Slate700,
                    contentColor = Slate50
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "Retry", fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun EmptyStateView(
    title: String,
    description: String,
    icon: ImageVector = Icons.Default.Info,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .background(Slate800, shape = RoundedCornerShape(26.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Slate400,
                    modifier = Modifier.size(26.dp)
                )
            }
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(color = Slate300)
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Slate500,
                    textAlign = TextAlign.Center
                )
            )
        }
    }
}
