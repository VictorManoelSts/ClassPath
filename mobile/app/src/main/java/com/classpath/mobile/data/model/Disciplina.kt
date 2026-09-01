package com.classpath.mobile.data.model

import kotlinx.serialization.Serializable

/** Espelha o recurso "disciplina" exposto pelo Back Acadêmico. */
@Serializable
data class Disciplina(
    val id: Int,
    val nome: String,
    val professor: String
)
