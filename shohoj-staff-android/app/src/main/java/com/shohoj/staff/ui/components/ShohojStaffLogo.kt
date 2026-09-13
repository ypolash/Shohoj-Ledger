package com.shohoj.staff.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.R
import com.shohoj.staff.ui.theme.*

/**
 * Premium, theme-matched brand logo for the Shohoj Staff application.
 * Highlights the distinctive Emerald to Cyan gradient and Dark Slate aesthetic.
 */
@Composable
fun ShohojStaffLogo(
    modifier: Modifier = Modifier,
    size: Dp = 44.dp,
    showGlow: Boolean = true,
    onClick: (() -> Unit)? = null
) {
    val cornerRadius = size * 0.24f
    val shape = RoundedCornerShape(cornerRadius)

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.18f,
        targetValue = 0.38f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    Box(
        modifier = modifier
            .size(size)
            .then(
                if (showGlow) {
                    Modifier.shadow(
                        elevation = size * 0.12f,
                        shape = shape,
                        ambientColor = Emerald500.copy(alpha = glowAlpha),
                        spotColor = Cyan400.copy(alpha = glowAlpha)
                    )
                } else Modifier
            )
            .clip(shape)
            .background(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Slate900,
                        Slate950
                    )
                )
            )
            .border(
                width = 1.2.dp,
                brush = Brush.linearGradient(
                    listOf(
                        Emerald400.copy(alpha = 0.75f),
                        Cyan400.copy(alpha = 0.75f)
                    )
                ),
                shape = shape
            )
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier),
        contentAlignment = Alignment.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.ic_shohoj_staff_logo),
            contentDescription = "Shohoj Staff Logo",
            modifier = Modifier.fillMaxSize(0.76f)
        )
    }
}

/**
 * Full branded header combining the themed logo and stylized typography.
 */
@Composable
fun ShohojStaffBrandHeader(
    modifier: Modifier = Modifier,
    logoSize: Dp = 64.dp,
    title: String = "Shohoj Staff",
    subtitle: String = "Employee Self Service Portal"
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        ShohojStaffLogo(size = logoSize, showGlow = true)

        Spacer(modifier = Modifier.height(14.dp))

        Text(
            text = title,
            style = MaterialTheme.typography.headlineLarge.copy(
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = Slate50,
                letterSpacing = 0.3.sp
            )
        )

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium.copy(
                color = Slate400,
                fontSize = 13.sp
            )
        )
    }
}
