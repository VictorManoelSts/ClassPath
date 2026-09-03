package com.portalturma.academico.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

/**
 * Representa a tabela "disciplinas" do PostgreSQL.
 * Campos: id, nome, professor (ver seção 9 da arquitetura).
 */
@Entity
@Table(name = "disciplinas")
public class Disciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O nome da disciplina é obrigatório")
    @Column(nullable = false, length = 100)
    private String nome;

    @NotBlank(message = "O nome do professor é obrigatório")
    @Column(nullable = false, length = 100)
    private String professor;

    public Disciplina() {
    }

    public Disciplina(String nome, String professor) {
        this.nome = nome;
        this.professor = professor;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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
