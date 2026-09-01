package com.classpath.mobile.data.repository

import com.classpath.mobile.data.model.Material
import com.classpath.mobile.data.remote.MateriaisApiService

/**
 * Implementação real do MateriaisRepository, pronta para quando o
 * Back Materiais estiver no ar.
 */
class RemoteMateriaisRepository(
    private val api: MateriaisApiService
) : MateriaisRepository {
    override suspend fun getMateriais(disciplina: String?): List<Material> = api.getMateriais(disciplina)
}
