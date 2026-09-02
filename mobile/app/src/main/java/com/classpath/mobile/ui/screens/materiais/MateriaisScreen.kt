package com.classpath.mobile.ui.screens.materiais

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Material
import com.classpath.mobile.data.repository.RepositoryProvider
import com.classpath.mobile.ui.common.EmptyState
import com.classpath.mobile.ui.common.ErrorState
import com.classpath.mobile.ui.common.FilterDropdown
import com.classpath.mobile.ui.common.LoadingState
import com.classpath.mobile.ui.common.UiState
import com.classpath.mobile.util.normalizedForMatch
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MateriaisScreen() {
    val viewModel: MateriaisViewModel = viewModel(
        factory = viewModelFactory {
            initializer {
                MateriaisViewModel(
                    RepositoryProvider.academicoRepository,
                    RepositoryProvider.materiaisRepository
                )
            }
        }
    )

    val uiState by viewModel.uiState.collectAsState()
    val disciplinaSelecionada by viewModel.disciplinaSelecionada.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()
    val context = LocalContext.current

    Scaffold(
        topBar = { TopAppBar(title = { Text("Materiais") }) },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        when (val state = uiState) {
            is UiState.Loading -> LoadingState(modifier = Modifier.padding(innerPadding))
            is UiState.Error -> ErrorState(state.message, modifier = Modifier.padding(innerPadding))
            is UiState.Success -> {
                val data = state.data
                val opcoes = listOf<Disciplina?>(null) + data.disciplinas
                // "disciplina" no Material é texto livre (sem FK com o Back Acadêmico),
                // então o filtro compara pelo nome, não por id — e usa comparação
                // normalizada (ignora acento/caixa/espaços) para não quebrar por
                // pequenas diferenças de digitação entre os dois back-ends.
                val nomeSelecionadoNormalizado = disciplinaSelecionada?.nome?.normalizedForMatch()
                val materiaisFiltrados = if (nomeSelecionadoNormalizado == null) {
                    data.materiais
                } else {
                    data.materiais.filter {
                        it.disciplina.normalizedForMatch() == nomeSelecionadoNormalizado
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    FilterDropdown(
                        label = "Disciplina",
                        options = opcoes,
                        selected = disciplinaSelecionada,
                        optionLabel = { it?.nome ?: "Todas as disciplinas" },
                        onSelected = { viewModel.selecionarDisciplina(it) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    )

                    if (materiaisFiltrados.isEmpty()) {
                        EmptyState("Nenhum material encontrado para esse filtro.")
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(materiaisFiltrados) { material ->
                                MaterialCard(
                                    material = material,
                                    onDownloadClick = {
                                        if (material.url != null) {
                                            context.startActivity(
                                                Intent(Intent.ACTION_VIEW, Uri.parse(material.url))
                                            )
                                        } else {
                                            coroutineScope.launch {
                                                snackbarHostState.showSnackbar(
                                                    "Este material será baixado assim que o Back Materiais estiver disponível."
                                                )
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MaterialCard(material: Material, onDownloadClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = material.nome, style = MaterialTheme.typography.titleSmall)
                Text(
                    text = material.disciplina,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Enviado em ${material.dataUpload}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(onClick = onDownloadClick) {
                Icon(Icons.Filled.Download, contentDescription = "Baixar material")
            }
        }
    }
}
