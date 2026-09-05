package com.classpath.mobile.data

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

    const val USE_MOCK_DATA = false

    // 10.0.2.2 é o endereço que o emulador Android usa para acessar o "localhost"
    // da máquina host. Ajustar para a URL real assim que os back-ends forem publicados.
    const val BASE_URL_ACADEMICO = "http://10.0.2.2:8080/" // Back Acadêmico (Java + Spring Boot)
    const val BASE_URL_MATERIAIS = "http://10.0.2.2:8000/" // Back Materiais (Python + FastAPI)
}
