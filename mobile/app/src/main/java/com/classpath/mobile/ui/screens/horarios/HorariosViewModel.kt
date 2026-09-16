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

    // Estado usado só pelo "puxar para atualizar": diferente de UiState.Loading,
    // ele não esconde a lista que já está na tela.
    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    private val _mensagemErroAtualizacao = MutableStateFlow<String?>(null)
    val mensagemErroAtualizacao: StateFlow<String?> = _mensagemErroAtualizacao.asStateFlow()

    private val _disciplinaSelecionada = MutableStateFlow<Disciplina?>(null)
    val disciplinaSelecionada: StateFlow<Disciplina?> = _disciplinaSelecionada.asStateFlow()

    init {
        carregar()
    }

    private suspend fun buscarDados(): HorariosData {
        val disciplinas = repository.getDisciplinas()
        val horarios = repository.getHorarios()
        return HorariosData(disciplinas, horarios)
    }

    /** Carregamento inicial (ou "tentar novamente" após um erro): ocupa a tela toda. */
    fun carregar() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                _uiState.value = UiState.Success(buscarDados())
            } catch (e: Exception) {
                _uiState.value = UiState.Error(
                    "Não foi possível carregar a grade de horários. Verifique sua conexão e tente novamente."
                )
            }
        }
    }

    /** Puxar para atualizar: mantém os dados atuais visíveis enquanto busca os novos. */
    fun atualizar() {
        if (_isRefreshing.value) return
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                _uiState.value = UiState.Success(buscarDados())
            } catch (e: Exception) {
                _mensagemErroAtualizacao.value = "Não foi possível atualizar a grade de horários."
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    fun mensagemErroAtualizacaoExibida() {
        _mensagemErroAtualizacao.value = null
    }

    fun selecionarDisciplina(disciplina: Disciplina?) {
        _disciplinaSelecionada.value = disciplina
    }
}
