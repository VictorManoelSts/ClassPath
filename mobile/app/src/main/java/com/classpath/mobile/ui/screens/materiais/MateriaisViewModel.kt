package com.classpath.mobile.ui.screens.materiais

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Material
import com.classpath.mobile.data.repository.AcademicoRepository
import com.classpath.mobile.data.repository.MateriaisRepository
import com.classpath.mobile.ui.common.UiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MateriaisData(
    val disciplinas: List<Disciplina>,
    val materiais: List<Material>
)

class MateriaisViewModel(
    private val academicoRepository: AcademicoRepository,
    private val materiaisRepository: MateriaisRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<MateriaisData>>(UiState.Loading)
    val uiState: StateFlow<UiState<MateriaisData>> = _uiState.asStateFlow()

    private val _disciplinaSelecionada = MutableStateFlow<Disciplina?>(null)
    val disciplinaSelecionada: StateFlow<Disciplina?> = _disciplinaSelecionada.asStateFlow()

    init {
        carregar()
    }

    fun carregar() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                // Duas requisições separadas — Back Acadêmico (nomes das disciplinas) e
                // Back Materiais (arquivos) nunca se comunicam entre si. Quem junta as
                // informações é o app, exatamente como no Front Aluno da documentação.
                val disciplinas = academicoRepository.getDisciplinas()
                val materiais = materiaisRepository.getMateriais()
                _uiState.value = UiState.Success(MateriaisData(disciplinas, materiais))
            } catch (e: Exception) {
                _uiState.value = UiState.Error(
                    "Não foi possível carregar os materiais. Verifique sua conexão e tente novamente."
                )
            }
        }
    }

    fun selecionarDisciplina(disciplina: Disciplina?) {
        _disciplinaSelecionada.value = disciplina
    }
}
