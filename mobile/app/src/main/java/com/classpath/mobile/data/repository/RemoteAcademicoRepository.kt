package com.classpath.mobile.data.repository

import com.classpath.mobile.data.model.Aviso
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Horario
import com.classpath.mobile.data.remote.AcademicoApiService

/**
 * Implementação real do AcademicoRepository, pronta para quando o
 * Back Acadêmico estiver no ar. Passa a ser usada automaticamente
 * assim que AppConfig.USE_MOCK_DATA virar false.
 */
class RemoteAcademicoRepository(
    private val api: AcademicoApiService
) : AcademicoRepository {
    override suspend fun getDisciplinas(): List<Disciplina> = api.getDisciplinas()
    override suspend fun getHorarios(disciplinaId: Int?): List<Horario> = api.getHorarios(disciplinaId)
    override suspend fun getAvisos(disciplinaId: Int?): List<Aviso> = api.getAvisos(disciplinaId)
}
