package com.classpath.mobile.ui.screens.avisos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.classpath.mobile.data.model.Aviso
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.repository.AcademicoRepository
import com.classpath.mobile.ui.common.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AvisosData(
    val disciplinas: List<Disciplina>,
    val avisos: List<Aviso>
)

class AvisosViewModel(
    private val repository: AcademicoRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<AvisosData>>(UiState.Loading)
    val uiState: StateFlow<UiState<AvisosData>> = _uiState.asStateFlow()

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
                val avisos = repository.getAvisos().sortedByDescending { it.dataPublicacao }
                _uiState.value = UiState.Success(AvisosData(disciplinas, avisos))
            } catch (e: Exception) {
                _uiState.value = UiState.Error(
                    "Não foi possível carregar os avisos. Verifique sua conexão e tente novamente."
                )
            }
        }
    }

    fun selecionarDisciplina(disciplina: Disciplina?) {
        _disciplinaSelecionada.value = disciplina
    }
}
