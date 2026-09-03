package com.classpath.academico.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Representa a tabela "avisos" do PostgreSQL.
 * Campos: id, titulo, descricao, disciplina_id, data_publicacao
 * (ver seção 9 da arquitetura).
 *
 * O relacionamento com Disciplina permite o filtro de avisos por matéria
 * (seção 4.2 - "Página de avisos").
 */
@Entity
@Table(name = "avisos")
public class Aviso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "O título é obrigatório")
    @Column(nullable = false, length = 150)
    private String titulo;

    @NotBlank(message = "A descrição é obrigatória")
    @Column(nullable = false, length = 2000)
    private String descricao;

    @NotNull(message = "A disciplina é obrigatória")
    @ManyToOne
    @JoinColumn(name = "disciplina_id", nullable = false)
    private Disciplina disciplina;

    @NotNull(message = "A data de publicação é obrigatória")
    @Column(name = "data_publicacao", nullable = false)
    private LocalDate dataPublicacao;

    public Aviso() {
    }

    public Aviso(String titulo, String descricao, Disciplina disciplina, LocalDate dataPublicacao) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.disciplina = disciplina;
        this.dataPublicacao = dataPublicacao;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Disciplina getDisciplina() {
        return disciplina;
    }

    public void setDisciplina(Disciplina disciplina) {
        this.disciplina = disciplina;
    }

    public LocalDate getDataPublicacao() {
        return dataPublicacao;
    }

    public void setDataPublicacao(LocalDate dataPublicacao) {
        this.dataPublicacao = dataPublicacao;
    }
}
