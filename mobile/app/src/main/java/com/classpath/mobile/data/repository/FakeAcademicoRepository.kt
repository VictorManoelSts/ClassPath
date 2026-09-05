package com.classpath.mobile.data.repository

import com.classpath.mobile.data.model.Aviso
import com.classpath.mobile.data.model.Disciplina
import com.classpath.mobile.data.model.Horario
import kotlinx.coroutines.delay

/**
 * Dados fictícios usados enquanto o Back Acadêmico não está pronto.
 * O pequeno delay() simula uma chamada de rede, para que a UI de loading
 * (LoadingState) faça sentido mesmo em modo mock.
 *
 * Assim que o backend subir, basta trocar AppConfig.USE_MOCK_DATA para
 * false — o RepositoryProvider passa a entregar RemoteAcademicoRepository
 * no lugar desta classe, sem precisar tocar em nenhuma tela.
 */
class FakeAcademicoRepository : AcademicoRepository {

    private val disciplinas = listOf(
        Disciplina(1, "Web e Mobile", "Prof. Ana Ferreira"),
        Disciplina(2, "Estrutura de Dados", "Prof. Carlos Souza"),
        Disciplina(3, "Banco de Dados", "Prof. Marina Alves"),
        Disciplina(4, "Redes de Computadores", "Prof. João Pedro Lima"),
        Disciplina(5, "Engenharia de Software", "Prof. Beatriz Nunes")
    )

    private val horarios = listOf(
        Horario(1, 1, "Segunda-feira", "08:00", "09:40", "Lab 3"),
        Horario(2, 2, "Segunda-feira", "10:00", "11:40", "Sala 12"),
        Horario(3, 3, "Terça-feira", "08:00", "09:40", "Sala 5"),
        Horario(4, 4, "Terça-feira", "14:00", "15:40", "Lab 1"),
        Horario(5, 1, "Quarta-feira", "08:00", "09:40", "Lab 3"),
        Horario(6, 5, "Quarta-feira", "10:00", "11:40", "Sala 8"),
        Horario(7, 2, "Quinta-feira", "08:00", "09:40", "Sala 12"),
        Horario(8, 3, "Quinta-feira", "10:00", "11:40", "Sala 5"),
        Horario(9, 4, "Sexta-feira", "08:00", "09:40", "Lab 1"),
        Horario(10, 5, "Sexta-feira", "10:00", "11:40", "Sala 8")
    )

    private val avisos = listOf(
        Aviso(
            id = 1,
            titulo = "Entrega do trabalho final adiada",
            descricao = "A entrega da documentação do ClassPath foi adiada para 16/09. Aproveitem o tempo extra para revisar a integração entre os módulos.",
            disciplinaId = 1,
            dataPublicacao = "2026-08-28"
        ),
        Aviso(
            id = 2,
            titulo = "Prova remarcada",
            descricao = "A prova de Estrutura de Dados foi remarcada para a próxima terça-feira, no mesmo horário.",
            disciplinaId = 2,
            dataPublicacao = "2026-08-27"
        ),
        Aviso(
            id = 3,
            titulo = "Aula vaga amanhã",
            descricao = "Não haverá aula de Banco de Dados amanhã. O professor repõe o conteúdo na semana seguinte.",
            disciplinaId = 3,
            dataPublicacao = "2026-08-26"
        ),
        Aviso(
            id = 4,
            titulo = "Semana acadêmica",
            descricao = "As inscrições para a semana acadêmica do curso já estão abertas no site da coordenação.",
            disciplinaId = null,
            dataPublicacao = "2026-08-24"
        ),
        Aviso(
            id = 5,
            titulo = "Manutenção nos laboratórios",
            descricao = "Os laboratórios 1 e 3 passarão por manutenção neste sábado. Nenhuma aula será afetada.",
            disciplinaId = null,
            dataPublicacao = "2026-08-20"
        )
    )

    override suspend fun getDisciplinas(): List<Disciplina> {
        delay(400)
        return disciplinas
    }

    override suspend fun getHorarios(disciplinaId: Int?): List<Horario> {
        delay(400)
        return if (disciplinaId == null) horarios else horarios.filter { it.disciplinaId == disciplinaId }
    }

    override suspend fun getAvisos(disciplinaId: Int?): List<Aviso> {
        delay(400)
        return if (disciplinaId == null) avisos else avisos.filter { it.disciplinaId == disciplinaId }
    }
}
