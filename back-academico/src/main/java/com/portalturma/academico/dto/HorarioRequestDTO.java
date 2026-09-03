package com.portalturma.academico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public class HorarioRequestDTO {

    @NotNull(message = "A disciplina é obrigatória")
    private Long disciplinaId;

    @NotBlank(message = "O dia da semana é obrigatório")
    @Size(max = 30, message = "O dia da semana deve ter no máximo 30 caracteres")
    private String diaSemana;

    @NotNull(message = "O horário de início é obrigatório")
    private LocalTime horarioInicio;

    @NotNull(message = "O horário de fim é obrigatório")
    private LocalTime horarioFim;

    @Size(max = 100, message = "A sala deve ter no máximo 100 caracteres")
    private String sala;

    public Long getDisciplinaId() {
        return disciplinaId;
    }

    public void setDisciplinaId(Long disciplinaId) {
        this.disciplinaId = disciplinaId;
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
