package com.classpath.mobile.ui.screens.avisos

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.classpath.mobile.data.model.Aviso
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.repository.RepositoryProvider
import com.classpath.mobile.ui.common.EmptyState
import com.classpath.mobile.ui.common.ErrorState
import com.classpath.mobile.ui.common.FilterDropdown
import com.classpath.mobile.ui.common.LoadingState
import com.classpath.mobile.ui.common.TagChip
import com.classpath.mobile.ui.common.UiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AvisosScreen() {
    val viewModel: AvisosViewModel = viewModel(
        factory = viewModelFactory {
            initializer { AvisosViewModel(RepositoryProvider.academicoRepository) }
        }
    )

    val uiState by viewModel.uiState.collectAsState()
    val disciplinaSelecionada by viewModel.disciplinaSelecionada.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Avisos") }) }
    ) { innerPadding ->
        when (val state = uiState) {
            is UiState.Loading -> LoadingState(modifier = Modifier.padding(innerPadding))
            is UiState.Error -> ErrorState(state.message, modifier = Modifier.padding(innerPadding))
            is UiState.Success -> {
                val data = state.data
                val opcoes = listOf<Disciplina?>(null) + data.disciplinas
                // Avisos gerais (disciplinaId == null) sempre aparecem, mesmo com um
                // filtro de disciplina selecionado — assim como descrito na documentação.
                val avisosFiltrados = if (disciplinaSelecionada == null) {
                    data.avisos
                } else {
                    data.avisos.filter { it.disciplinaId == null || it.disciplinaId == disciplinaSelecionada?.id }
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

                    if (avisosFiltrados.isEmpty()) {
                        EmptyState("Nenhum aviso encontrado para esse filtro.")
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(avisosFiltrados) { aviso ->
                                AvisoCard(
                                    aviso = aviso,
                                    disciplina = data.disciplinas.find { it.id == aviso.disciplinaId }
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
private fun AvisoCard(aviso: Aviso, disciplina: Disciplina?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            TagChip(text = disciplina?.nome ?: "Geral")
            Text(
                text = aviso.titulo,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 8.dp)
            )
            Text(
                text = aviso.mensagem,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 4.dp)
            )
            Text(
                text = aviso.dataPublicacao,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}
