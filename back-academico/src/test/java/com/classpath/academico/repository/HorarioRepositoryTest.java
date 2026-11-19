package com.classpath.academico.repository;

import com.classpath.academico.model.Disciplina;
import com.classpath.academico.model.Horario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class HorarioRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private HorarioRepository horarioRepository;

    @Test
    void buscaOMesmoDiaIgnorandoCaixaEEspacosNasExtremidades() {
        Disciplina disciplina = entityManager.persist(new Disciplina("Matemática", "Maria"));
        LocalTime inicio = LocalTime.of(8, 0);
        LocalTime fim = LocalTime.of(10, 0);
        Horario horario = entityManager.persist(new Horario(disciplina, " Segunda-feira ", inicio, fim, "Sala 01"));
        entityManager.persistAndFlush(new Horario(disciplina, "Terça-feira", inicio, fim, "Sala 01"));

        assertThat(horarioRepository.findByDiaSemana(" SEGUNDA-FEIRA "))
                .extracting(Horario::getId)
                .containsExactly(horario.getId());
    }
}
