package com.classpath.mobile.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.ui.graphics.vector.ImageVector

/** Uma entrada da navegação inferior do app. */
sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    data object Horarios : Screen("horarios", "Grade", Icons.Filled.CalendarMonth)
    data object Avisos : Screen("avisos", "Avisos", Icons.Filled.Campaign)
    data object Materiais : Screen("materiais", "Materiais", Icons.Filled.FolderOpen)

    companion object {
        val items = listOf(Horarios, Avisos, Materiais)
    }
}
