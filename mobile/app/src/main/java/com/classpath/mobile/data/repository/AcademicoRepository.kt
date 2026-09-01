package com.classpath.mobile.data.repository

import com.classpath.mobile.data.model.Aviso
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Horario

/** Contrato de acesso aos dados do Back Acadêmico, independente da implementação. */
interface AcademicoRepository {
    suspend fun getDisciplinas(): List<Disciplina>
    suspend fun getHorarios(disciplinaId: Int? = null): List<Horario>
    suspend fun getAvisos(disciplinaId: Int? = null): List<Aviso>
}
