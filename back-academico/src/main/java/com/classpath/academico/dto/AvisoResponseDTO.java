package com.classpath.academico.dto;

import com.classpath.academico.model.Aviso;

import java.time.LocalDate;

/**
 * DTO usado para retornar avisos já com o nome da disciplina resolvido,
 * evitando expor a entidade JPA diretamente na API.
 */
public class AvisoResponseDTO {

    private final Long id;
    private final String titulo;
    private final String descricao;
    private final Long disciplinaId;
    private final String disciplinaNome;
    private final LocalDate dataPublicacao;

    public AvisoResponseDTO(Aviso aviso) {
        this.id = aviso.getId();
        this.titulo = aviso.getTitulo();
        this.descricao = aviso.getDescricao();
        this.disciplinaId = aviso.getDisciplina().getId();
        this.disciplinaNome = aviso.getDisciplina().getNome();
        this.dataPublicacao = aviso.getDataPublicacao();
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public Long getDisciplinaId() {
        return disciplinaId;
    }

    public String getDisciplinaNome() {
        return disciplinaNome;
    }

    public LocalDate getDataPublicacao() {
        return dataPublicacao;
    }
}
