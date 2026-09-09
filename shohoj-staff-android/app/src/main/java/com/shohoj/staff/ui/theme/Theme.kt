package com.shohoj.staff.ui.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = Emerald500,
    onPrimary = Slate950,
    primaryContainer = Emerald700,
    onPrimaryContainer = Slate50,
    secondary = Cyan400,
    onSecondary = Slate950,
    background = Slate950,
    onBackground = Slate50,
    surface = Slate900,
    onSurface = Slate50,
    surfaceVariant = Slate800,
    onSurfaceVariant = Slate300,
    error = Rose500,
    onError = Slate50
)

@Composable
fun ShohojStaffTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Slate950.toArgb()
            window.navigationBarColor = Slate950.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
