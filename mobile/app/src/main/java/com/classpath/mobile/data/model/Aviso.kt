package com.classpath.mobile.data.model

import kotlinx.serialization.Serializable

/**
 * Espelha o recurso "aviso" exposto pelo Back Acadêmico.
 * disciplinaId == null representa um aviso geral (para toda a turma).
 */
@Serializable
data class Aviso(
    val id: Int,
    val titulo: String,
    val descricao: String,
    val disciplinaId: Int? = null,
    val dataPublicacao: String
)
