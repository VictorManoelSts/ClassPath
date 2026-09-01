package com.classpath.mobile.data.remote

import com.classpath.mobile.data.AppConfig
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Ponto único de configuração do Retrofit para os dois back-ends.
 *
 * Não é usado enquanto AppConfig.USE_MOCK_DATA = true, mas já fica pronto:
 * quando o Back Acadêmico e o Back Materiais estiverem no ar, o
 * RepositoryProvider passa a usar RemoteAcademicoRepository/RemoteMateriaisRepository,
 * que consomem exatamente esses services.
 */
object NetworkModule {

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()

    private fun buildRetrofit(baseUrl: String): Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    val academicoApi: AcademicoApiService by lazy {
        buildRetrofit(AppConfig.BASE_URL_ACADEMICO).create(AcademicoApiService::class.java)
    }

    val materiaisApi: MateriaisApiService by lazy {
        buildRetrofit(AppConfig.BASE_URL_MATERIAIS).create(MateriaisApiService::class.java)
    }
}
