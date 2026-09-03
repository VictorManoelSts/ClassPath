package com.portalturma.academico.repository;

import com.portalturma.academico.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {



    // Usado para exibir a grade filtrada por disciplina, se necessário
    List<Horario> findByDisciplinaId(Long disciplinaId);

    boolean existsByDisciplinaId(Long disciplinaId);
}
