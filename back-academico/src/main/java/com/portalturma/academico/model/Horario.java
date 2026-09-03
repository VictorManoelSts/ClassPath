package com.portalturma.academico.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

/**
 * Representa a tabela "horarios" do PostgreSQL.
 * Campos: id, disciplina_id, dia_semana, horario_inicio, horario_fim, sala
 * (ver seção 9 da arquitetura).
 */
@Entity
@Table(name = "horarios")
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "A disciplina é obrigatória")
    @ManyToOne
    @JoinColumn(name = "disciplina_id", nullable = false)
    private Disciplina disciplina;

    @NotBlank(message = "O dia da semana é obrigatório")
    @Column(name = "dia_semana", nullable = false, length = 30)
    private String diaSemana; // Ex: "Segunda-feira"

    @NotNull(message = "O horário de início é obrigatório")
    @Column(name = "horario_inicio", nullable = false)
    private LocalTime horarioInicio;

    @NotNull(message = "O horário de fim é obrigatório")
    @Column(name = "horario_fim", nullable = false)
    private LocalTime horarioFim;

    // Sala é opcional, conforme a seção 4.2 do documento ("caso seja cadastrada")
    @Column(length = 100)
    private String sala;

    public Horario() {
    }

    public Horario(Disciplina disciplina, String diaSemana, LocalTime horarioInicio, LocalTime horarioFim, String sala) {
        this.disciplina = disciplina;
        this.diaSemana = diaSemana;
        this.horarioInicio = horarioInicio;
        this.horarioFim = horarioFim;
        this.sala = sala;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Disciplina getDisciplina() {
        return disciplina;
    }

    public void setDisciplina(Disciplina disciplina) {
        this.disciplina = disciplina;
    }

    public String getDiaSemana() {
        return diaSemana;
    }

    public void setDiaSemana(String diaSemana) {
        this.diaSemana = diaSemana;
    }

    public LocalTime getHorarioInicio() {
        return horarioInicio;
    }

    public void setHorarioInicio(LocalTime horarioInicio) {
        this.horarioInicio = horarioInicio;
    }

    public LocalTime getHorarioFim() {
        return horarioFim;
    }

    public void setHorarioFim(LocalTime horarioFim) {
        this.horarioFim = horarioFim;
    }

    public String getSala() {
        return sala;
    }

    public void setSala(String sala) {
        this.sala = sala;
    }
}
