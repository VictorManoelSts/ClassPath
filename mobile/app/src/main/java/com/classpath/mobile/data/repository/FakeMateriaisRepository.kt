package com.classpath.mobile.data.repository

import com.classpath.mobile.data.model.Material
import kotlinx.coroutines.delay

/**
 * Dados fictícios usados enquanto o Back Materiais não está pronto.
 * Note que "disciplina" aqui é só texto livre (igual ao backend real,
 * que não valida esse campo contra o Back Acadêmico).
 */
class FakeMateriaisRepository : MateriaisRepository {

    private val materiais = listOf(
        Material("1", "Aula 01 - Introdução ao React.pdf", "Web e Mobile", "2026-08-10", 2500000L, "application/pdf"),
        Material("2", "Aula 02 - Componentes e Props.pdf", "Web e Mobile", "2026-08-17", 1800000L, "application/pdf"),
        Material("3", "Slides - Árvores Binárias.pdf", "Estrutura de Dados", "2026-08-12", 3200000L, "application/pdf"),
        Material("4", "Slides - Listas Encadeadas.pdf", "Estrutura de Dados", "2026-08-05", 1500000L, "application/pdf"),
        Material("5", "Modelagem Relacional.pdf", "Banco de Dados", "2026-08-14", 4100000L, "application/pdf"),
        Material("6", "Normalização.pdf", "Banco de Dados", "2026-08-21", 2200000L, "application/pdf"),
        Material("7", "Camada de Transporte.pdf", "Redes de Computadores", "2026-08-11", 5000000L, "application/pdf"),
        Material("8", "Requisitos de Software.pdf", "Engenharia de Software", "2026-08-09", 1100000L, "application/pdf")
    )

    override suspend fun getMateriais(disciplina: String?): List<Material> {
        delay(400)
        return if (disciplina == null) materiais else materiais.filter { it.disciplina == disciplina }
    }
}
