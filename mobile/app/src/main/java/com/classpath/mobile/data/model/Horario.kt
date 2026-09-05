package com.classpath.mobile.data.model

import kotlinx.serialization.Serializable

/** Espelha o recurso "horário" exposto pelo Back Acadêmico. */
@Serializable
data class Horario(
    val id: Int,
    val disciplinaId: Int,
    val diaSemana: String,
    val horarioInicio: String,
    val horarioFim: String,
    val sala: String? = null
)
