package com.classpath.mobile.data

import com.classpath.mobile.BuildConfig
/**
 * Configuração central do app.
 *
 * Enquanto os back-ends não estiverem prontos, deixe USE_MOCK_DATA = true:
 * o app funciona inteiro com dados fictícios (ver pacote data.repository,
 * classes FakeAcademicoRepository e FakeMateriaisRepository).
 *
 * Quando o Back Acadêmico e o Back Materiais estiverem no ar, basta:
 *   1) ajustar as URLs abaixo;
 *   2) trocar USE_MOCK_DATA para false.
 * O resto do app (telas, ViewModels) não muda nada, pois depende apenas
 * das interfaces AcademicoRepository / MateriaisRepository.
 */
object AppConfig {

    const val USE_MOCK_DATA = BuildConfig.USE_MOCK
    const val BASE_URL_ACADEMICO = BuildConfig.URL_ACADEMICO
    const val BASE_URL_MATERIAIS = BuildConfig.URL_MATERIAIS
}
