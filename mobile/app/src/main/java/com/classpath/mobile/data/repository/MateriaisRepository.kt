package com.classpath.mobile.data.repository

import com.classpath.mobile.data.model.Material

/** Contrato de acesso aos dados do Back Materiais, independente da implementação. */
interface MateriaisRepository {
    suspend fun getMateriais(disciplina: String? = null): List<Material>
}
