package com.classpath.academico.dto;

import com.classpath.academico.model.Disciplina;

public class DisciplinaResponseDTO {

    private final Long id;
    private final String nome;
    private final String professor;

    public DisciplinaResponseDTO(Disciplina disciplina) {
        this.id = disciplina.getId();
        this.nome = disciplina.getNome();
        this.professor = disciplina.getProfessor();
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getProfessor() {
        return professor;
    }
}
