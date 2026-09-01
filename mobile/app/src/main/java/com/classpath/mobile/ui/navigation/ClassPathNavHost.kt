package com.classpath.mobile.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.classpath.mobile.ui.screens.avisos.AvisosScreen
import com.classpath.mobile.ui.screens.horarios.HorariosScreen
import com.classpath.mobile.ui.screens.materiais.MateriaisScreen

/**
 * Estrutura de navegação principal: barra inferior com as 3 telas de consulta
 * do app (equivalentes ao Front Aluno da documentação — só leitura, sem login).
 */
@Composable
fun ClassPathNavHost() {
    val navController = rememberNavController()

    Scaffold(
        bottomBar = {
            val navBackStackEntry by navController.currentBackStackEntryAsState()
            val currentRoute = navBackStackEntry?.destination?.route

            NavigationBar {
                Screen.items.forEach { screen ->
                    NavigationBarItem(
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(screen.icon, contentDescription = screen.label) },
                        label = { Text(screen.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Horarios.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Horarios.route) { HorariosScreen() }
            composable(Screen.Avisos.route) { AvisosScreen() }
            composable(Screen.Materiais.route) { MateriaisScreen() }
        }
    }
}
