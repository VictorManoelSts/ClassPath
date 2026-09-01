package com.classpath.mobile.ui.common

/** Estado genérico de carregamento usado pelos ViewModels de todas as telas. */
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String) : UiState<Nothing>
}
