package com.classpath.academico.repository;

import com.classpath.academico.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {



    // Usado para exibir a grade filtrada por disciplina, se necessário
    List<Horario> findByDisciplinaId(Long disciplinaId);
    List<Horario> findByDiaSemana(String diaSemana);

    boolean existsByDisciplinaId(Long disciplinaId);
}
