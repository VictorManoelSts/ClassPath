package com.portalturma.academico.repository;

import com.portalturma.academico.model.Aviso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvisoRepository extends JpaRepository<Aviso, Long> {

    // Suporta o filtro por disciplina exigido na "Página de avisos" (seção 4.2)
    List<Aviso> findByDisciplinaIdOrderByDataPublicacaoDesc(Long disciplinaId);

    // Lista geral, mais recentes primeiro
    List<Aviso> findAllByOrderByDataPublicacaoDesc();

    boolean existsByDisciplinaId(Long disciplinaId);
}
