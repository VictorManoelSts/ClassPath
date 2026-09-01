package com.classpath.mobile.data.model

import kotlinx.serialization.Serializable

/**
 * Espelha o recurso "material" exposto pelo Back Materiais.
 * "disciplina" é apenas o nome recebido junto do upload (String livre) —
 * o Back Materiais não valida esse valor contra o Back Acadêmico, então
 * o app também trata os dois como fontes independentes.
 */
@Serializable
data class Material(
    val id: String,
    val nome: String,
    val disciplina: String,
    val dataUpload: String,
    val url: String? = null
)
