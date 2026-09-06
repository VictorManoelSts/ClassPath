package com.classpath.mobile.data.model

import com.classpath.mobile.data.AppConfig
import kotlinx.serialization.SerialName
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
    @SerialName("data_upload") val dataUpload: String,
    val tamanho: Long,
    @SerialName("content_type") val contentType: String
) {
    val url: String
        get() = "${AppConfig.BASE_URL_MATERIAIS}materiais/$id"
}