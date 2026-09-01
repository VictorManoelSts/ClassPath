package com.classpath.mobile.data.model

import kotlinx.serialization.Serializable

/** Espelha o recurso "horário" exposto pelo Back Acadêmico. */
@Serializable
data class Horario(
    val id: Int,
    val disciplinaId: Int,
    val diaSemana: String,
    val horaInicio: String,
    val horaFim: String,
    val sala: String? = null
)
