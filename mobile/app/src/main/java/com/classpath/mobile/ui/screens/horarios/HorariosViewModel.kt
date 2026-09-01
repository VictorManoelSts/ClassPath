package com.classpath.mobile.ui.screens.horarios

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Horario
import com.classpath.mobile.data.repository.AcademicoRepository
import com.classpath.mobile.ui.common.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HorariosData(
    val disciplinas: List<Disciplina>,
    val horarios: List<Horario>
)

class HorariosViewModel(
    private val repository: AcademicoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<HorariosData>>(UiState.Loading)
    val uiState: StateFlow<UiState<HorariosData>> = _uiState.asStateFlow()

    private val _disciplinaSelecionada = MutableStateFlow<Disciplina?>(null)
    val disciplinaSelecionada: StateFlow<Disciplina?> = _disciplinaSelecionada.asStateFlow()

    init {
        carregar()
    }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                val disciplinas = repository.getDisciplinas()
                val horarios = repository.getHorarios()
                _uiState.value = UiState.Success(HorariosData(disciplinas, horarios))
            } catch (e: Exception) {
                _uiState.value = UiState.Error(
                    "Não foi possível carregar a grade de horários. Verifique sua conexão e tente novamente."
                )
            }
        }
    }

    fun selecionarDisciplina(disciplina: Disciplina?) {
        _disciplinaSelecionada.value = disciplina
    }
}
