package com.classpath.mobile.data.remote

import com.classpath.mobile.data.model.Aviso
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Horario
import retrofit2.http.GET
import retrofit2.http.Query

/**
 * Endpoints do Back Acadêmico (Java + Spring Boot) usados pelo app.
 * O app mobile é somente leitura (equivalente ao Front Aluno da documentação),
 * então só expomos GETs aqui — nada de criar/editar/apagar.
 *
 * Ainda não é chamado em lugar nenhum (ver AppConfig.USE_MOCK_DATA), mas já
 * fica pronto para quando o backend estiver disponível.
 */
interface AcademicoApiService {

    @GET("api/disciplinas")
    suspend fun getDisciplinas(): List<Disciplina>

    @GET("api/horarios")
    suspend fun getHorarios(@Query("disciplinaId") disciplinaId: Int? = null): List<Horario>

    @GET("api/avisos")
    suspend fun getAvisos(@Query("disciplinaId") disciplinaId: Int? = null): List<Aviso>
}
