package com.classpath.mobile.data.remote

import com.classpath.mobile.data.model.Material
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Endpoints do Back Materiais (Python + FastAPI + MongoDB/GridFS) usados pelo app.
 * O download em si (GET /materiais/{id}) é resolvido abrindo a URL do arquivo
 * diretamente (navegador/gerenciador de downloads do Android), então não
 * precisa de um método de streaming aqui.
 */
interface MateriaisApiService {

    @GET("materiais")
    suspend fun getMateriais(@Query("disciplina") disciplina: String? = null): List<Material>
}
