package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.shohoj.staff.data.model.AppUpdateInfo
import com.shohoj.staff.ui.theme.*

@Composable
fun AppUpdateDialog(
    updateInfo: AppUpdateInfo,
    currentVersionName: String,
    onDownload: (downloadUrl: String) -> Unit,
    onDismiss: () -> Unit
) {
    val isForce = updateInfo.isForceUpdate

    Dialog(
        onDismissRequest = {
            if (!isForce) onDismiss()
        },
        properties = DialogProperties(
            dismissOnBackPress = !isForce,
            dismissOnClickOutside = !isForce,
            usePlatformDefaultWidth = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .wrapContentHeight()
                .clip(RoundedCornerShape(24.dp))
                .background(Slate900)
                .border(1.dp, Slate700, RoundedCornerShape(24.dp))
                .padding(24.dp)
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Top Icon Badge with Glow
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Emerald600, Cyan500)
                            )
                        )
                ) {
                    Icon(
                        imageVector = Icons.Default.SystemUpdate,
                        contentDescription = "Update Available",
                        tint = Slate50,
                        modifier = Modifier.size(36.dp)
                    )
                }

                // Title & Subtitle
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = updateInfo.title.ifEmpty { "New Version v${updateInfo.versionName} Available" },
                        style = MaterialTheme.typography.titleLarge.copy(
                            color = Slate50,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            textAlign = TextAlign.Center
                        )
                    )

                    Text(
                        text = "A new update for Shohoj Staff is ready to install.",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Slate400,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center
                        )
                    )
                }

                // Version Badge Comparison
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Slate800)
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "v$currentVersionName",
                        color = Slate400,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )

                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = Emerald400,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))

                    Text(
                        text = "v${updateInfo.versionName}",
                        color = Emerald400,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    updateInfo.fileSize?.let { size ->
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "($size)",
                            color = Slate500,
                            fontSize = 12.sp
                        )
                    }
                }

                // Release Highlights / Changelog Box
                if (updateInfo.releaseNotes.isNotEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 200.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Slate950.copy(alpha = 0.5f))
                            .border(1.dp, Slate800, RoundedCornerShape(14.dp))
                            .padding(14.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "WHAT'S NEW",
                            style = MaterialTheme.typography.labelMedium.copy(
                                color = Emerald400,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                letterSpacing = 1.sp
                            )
                        )

                        updateInfo.releaseNotes.forEach { note ->
                            Row(
                                verticalAlignment = Alignment.Top,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = Emerald500,
                                    modifier = Modifier
                                        .size(15.dp)
                                        .padding(top = 2.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = note,
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Slate300,
                                        fontSize = 12.sp,
                                        lineHeight = 17.sp
                                    )
                                )
                            }
                        }
                    }
                }

                // Download Button
                Button(
                    onClick = {
                        onDownload(updateInfo.downloadUrl)
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Emerald600,
                        contentColor = Slate50
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Download Update (v${updateInfo.versionName})",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    )
                }

                // Dismiss / Later Button (if not forced update)
                if (!isForce) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Remind Me Later",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = Slate400,
                                fontSize = 13.sp
                            )
                        )
                    }
                } else {
                    Text(
                        text = "⚠️ This is a required update to continue using Shohoj Staff.",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = Amber400,
                            fontSize = 11.sp,
                            textAlign = TextAlign.Center
                        ),
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}
