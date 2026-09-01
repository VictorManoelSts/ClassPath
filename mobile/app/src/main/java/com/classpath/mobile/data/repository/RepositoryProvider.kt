package com.classpath.mobile.data.repository

import com.classpath.mobile.data.AppConfig
import com.classpath.mobile.data.remote.NetworkModule

/**
 * Fábrica simples dos repositórios consumidos pela UI (ViewModels).
 *
 * Enquanto AppConfig.USE_MOCK_DATA for true, todo o app funciona com
 * dados fictícios, sem depender dos back-ends estarem no ar. Quando eles
 * existirem, é só mudar essa flag — nada mais precisa ser alterado.
 */
object RepositoryProvider {

    val academicoRepository: AcademicoRepository by lazy {
        if (AppConfig.USE_MOCK_DATA) {
            FakeAcademicoRepository()
        } else {
            RemoteAcademicoRepository(NetworkModule.academicoApi)
        }
    }

    val materiaisRepository: MateriaisRepository by lazy {
        if (AppConfig.USE_MOCK_DATA) {
            FakeMateriaisRepository()
        } else {
            RemoteMateriaisRepository(NetworkModule.materiaisApi)
        }
    }
}
