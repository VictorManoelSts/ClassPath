package com.classpath.mobile.ui.screens.horarios

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
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
import com.classpath.mobile.data.model.DiaSemana
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Horario
import com.classpath.mobile.data.repository.RepositoryProvider
import com.classpath.mobile.ui.common.EmptyState
import com.classpath.mobile.ui.common.ErrorState
import com.classpath.mobile.ui.common.FilterDropdown
import com.classpath.mobile.ui.common.LoadingState
import com.classpath.mobile.ui.common.UiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HorariosScreen() {
    val viewModel: HorariosViewModel = viewModel(
        factory = viewModelFactory {
            initializer { HorariosViewModel(RepositoryProvider.academicoRepository) }
        }
    )

    val uiState by viewModel.uiState.collectAsState()
    val disciplinaSelecionada by viewModel.disciplinaSelecionada.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Grade de Horários") }) }
    ) { innerPadding ->
        when (val state = uiState) {
            is UiState.Loading -> LoadingState(modifier = Modifier.padding(innerPadding))
            is UiState.Error -> ErrorState(state.message, modifier = Modifier.padding(innerPadding))
            is UiState.Success -> {
                val data = state.data
                val opcoes = listOf<Disciplina?>(null) + data.disciplinas
                val horariosFiltrados = if (disciplinaSelecionada == null) {
                    data.horarios
                } else {
                    data.horarios.filter { it.disciplinaId == disciplinaSelecionada?.id }
                }
                val agrupados = DiaSemana.ORDEM.mapNotNull { dia ->
                    val doDia = horariosFiltrados.filter { it.diaSemana == dia }.sortedBy { it.horaInicio }
                    if (doDia.isEmpty()) null else dia to doDia
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

                    if (agrupados.isEmpty()) {
                        EmptyState("Nenhum horário encontrado para esse filtro.")
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            agrupados.forEach { (dia, horariosDoDia) ->
                                item {
                                    Text(
                                        text = dia,
                                        style = MaterialTheme.typography.titleMedium,
                                        modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                                    )
                                }
                                items(horariosDoDia) { horario ->
                                    HorarioCard(
                                        horario = horario,
                                        disciplina = data.disciplinas.find { it.id == horario.disciplinaId }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HorarioCard(horario: Horario, disciplina: Disciplina?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = disciplina?.nome ?: "Disciplina não encontrada",
                    style = MaterialTheme.typography.titleSmall
                )
                Text(
                    text = disciplina?.professor ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                horario.sala?.let {
                    Text(
                        text = "Sala: $it",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            Text(
                text = "${horario.horaInicio} - ${horario.horaFim}",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
