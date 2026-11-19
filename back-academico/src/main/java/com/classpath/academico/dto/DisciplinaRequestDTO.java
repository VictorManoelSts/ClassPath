package com.classpath.academico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DisciplinaRequestDTO {

    @NotBlank(message = "O nome da disciplina é obrigatório")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    private String nome;

    @NotBlank(message = "O nome do professor é obrigatório")
    @Size(max = 100, message = "O professor deve ter no máximo 100 caracteres")
    private String professor;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getProfessor() {
        return professor;
    }

    public void setProfessor(String professor) {
        this.professor = professor;
    }
}
