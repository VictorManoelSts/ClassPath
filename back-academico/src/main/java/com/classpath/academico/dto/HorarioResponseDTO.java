package com.classpath.academico.dto;

import com.classpath.academico.model.Horario;

import java.time.LocalTime;

public class HorarioResponseDTO {

    private final Long id;
    private final Long disciplinaId;
    private final String disciplinaNome;
    private final String diaSemana;
    private final LocalTime horarioInicio;
    private final LocalTime horarioFim;
    private final String sala;

    public HorarioResponseDTO(Horario horario) {
        this.id = horario.getId();
        this.disciplinaId = horario.getDisciplina().getId();
        this.disciplinaNome = horario.getDisciplina().getNome();
        this.diaSemana = horario.getDiaSemana();
        this.horarioInicio = horario.getHorarioInicio();
        this.horarioFim = horario.getHorarioFim();
        this.sala = horario.getSala();
    }

    public Long getId() {
        return id;
    }

    public Long getDisciplinaId() {
        return disciplinaId;
    }

    public String getDisciplinaNome() {
        return disciplinaNome;
    }

    public String getDiaSemana() {
        return diaSemana;
    }

    public LocalTime getHorarioInicio() {
        return horarioInicio;
    }

    public LocalTime getHorarioFim() {
        return horarioFim;
    }

    public String getSala() {
        return sala;
    }
}
