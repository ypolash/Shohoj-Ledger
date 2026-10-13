package com.shohoj.staff.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val NagadLightColorScheme = lightColorScheme(
    primary = NagadOrange,
    onPrimary = Color.White,
    primaryContainer = NagadSurfaceTint,
    onPrimaryContainer = NagadOrangeDark,
    secondary = NagadRed,
    onSecondary = Color.White,
    background = NagadBgWarm,
    onBackground = NagadTextPrimary,
    surface = Color.White,
    onSurface = NagadTextPrimary,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = NagadTextSecondary,
    error = Rose500,
    onError = Color.White
)

@Composable
fun ShohojStaffTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = NagadLightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = android.graphics.Color.TRANSPARENT
            window.navigationBarColor = android.graphics.Color.WHITE
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = true
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
