package com.classpath.academico.repository;

import com.classpath.academico.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {



    // Usado para exibir a grade filtrada por disciplina, se necessário
    List<Horario> findByDisciplinaId(Long disciplinaId);

    @Query("select h from Horario h where lower(trim(h.diaSemana)) = lower(trim(:diaSemana))")
    List<Horario> findByDiaSemana(@Param("diaSemana") String diaSemana);

    boolean existsByDisciplinaId(Long disciplinaId);
}
