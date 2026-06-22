package com.bambuzau3d.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme =
  darkColorScheme(
    primary = BambuzauGreen,
    onPrimary = BambuzauCharcoal,
    primaryContainer = BambuzauGreenDark,
    onPrimaryContainer = BambuzauTextLight,
    secondary = BambuzauGold,
    onSecondary = BambuzauCharcoal,
    secondaryContainer = BambuzauBorder,
    onSecondaryContainer = BambuzauTextLight,
    tertiary = BambuzauPurple,
    background = BambuzauCharcoal,
    onBackground = BambuzauTextLight,
    surface = BambuzauCard,
    onSurface = BambuzauTextLight,
    surfaceVariant = BambuzauBorder,
    onSurfaceVariant = BambuzauTextMuted,
    outline = BambuzauTextMuted,
    error = BambuzauSunset
  )

private val LightColorScheme =
  lightColorScheme(
    primary = BambuzauGreenDark,
    onPrimary = Color.White,
    primaryContainer = BambuzauGreen,
    onPrimaryContainer = BambuzauCharcoal,
    secondary = BambuzauGold,
    onSecondary = BambuzauCharcoal,
    secondaryContainer = Color(0xFFE5DFD0),
    onSecondaryContainer = BambuzauCharcoal,
    tertiary = BambuzauPurple,
    background = Color(0xFFF8F6F0), // Ivory white like the Bambu Light Theme
    onBackground = Color(0xFF2C3827),
    surface = Color.White,
    onSurface = Color(0xFF2C3827),
    surfaceVariant = Color(0xFFE5DFD0),
    onSurfaceVariant = Color(0xFF667F60),
    outline = Color(0xFF667F60),
    error = BambuzauSunset
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // Disable dynamic color by default so our gorgeous brand colors are enforced on all devices
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }

      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
