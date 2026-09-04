package com.classpath.academico.service;

import com.classpath.academico.dto.HorarioRequestDTO;
import com.classpath.academico.dto.HorarioResponseDTO;
import com.classpath.academico.exception.BusinessRuleException;
import com.classpath.academico.exception.ResourceNotFoundException;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.model.Horario;
import com.classpath.academico.repository.HorarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HorarioService {

    private final HorarioRepository horarioRepository;
    private final DisciplinaService disciplinaService;

    public HorarioService(HorarioRepository horarioRepository, DisciplinaService disciplinaService) {
        this.horarioRepository = horarioRepository;
        this.disciplinaService = disciplinaService;
    }

    public List<HorarioResponseDTO> listar(Long disciplinaId) {
        List<Horario> horarios = disciplinaId == null
                ? horarioRepository.findAll()
                : horarioRepository.findByDisciplinaId(disciplinaId);

        return horarios.stream().map(HorarioResponseDTO::new).toList();
    }

    public HorarioResponseDTO buscarPorId(Long id) {
        return new HorarioResponseDTO(buscarHorario(id));
    }

    public HorarioResponseDTO criar(HorarioRequestDTO dto) {
        validarIntervalo(dto);
        validarConflitoDeHorario(dto, null);
        Disciplina disciplina = disciplinaService.buscarPorId(dto.getDisciplinaId());

        Horario horario = new Horario(
                disciplina,
                dto.getDiaSemana().trim(),
                dto.getHorarioInicio(),
                dto.getHorarioFim(),
                normalizarSala(dto.getSala())
        );

        return new HorarioResponseDTO(horarioRepository.save(horario));
    }

    public HorarioResponseDTO atualizar(Long id, HorarioRequestDTO dto) {
        validarIntervalo(dto);
        validarConflitoDeHorario(dto, id);
        Horario horario = buscarHorario(id);
        Disciplina disciplina = disciplinaService.buscarPorId(dto.getDisciplinaId());

        horario.setDisciplina(disciplina);
        horario.setDiaSemana(dto.getDiaSemana().trim());
        horario.setHorarioInicio(dto.getHorarioInicio());
        horario.setHorarioFim(dto.getHorarioFim());
        horario.setSala(normalizarSala(dto.getSala()));

        return new HorarioResponseDTO(horarioRepository.save(horario));
    }

    public void excluir(Long id) {
        Horario horario = buscarHorario(id);
        horarioRepository.delete(horario);
    }

    private Horario buscarHorario(Long id) {
        return horarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horário não encontrado: " + id));
    }

    private void validarIntervalo(HorarioRequestDTO dto) {
        if (!dto.getHorarioInicio().isBefore(dto.getHorarioFim())) {
            throw new BusinessRuleException("O horário de início deve ser anterior ao horário de fim");
        }
    }

    private void validarConflitoDeHorario(HorarioRequestDTO dto, Long idIgnorar) {
        List<Horario> horariosNoMesmoDia = horarioRepository.findByDiaSemana(dto.getDiaSemana().trim());

        boolean existeConflito = horariosNoMesmoDia.stream()
                .filter(h -> idIgnorar == null || !h.getId().equals(idIgnorar))
                .anyMatch(h -> horariosSeSobrepõem(h, dto));

        if (existeConflito) {
            throw new BusinessRuleException(
                    "Já existe uma aula cadastrada que se sobrepõe a este dia e horário"
            );
        }
    }

    private boolean horariosSeSobrepõem(Horario existente, HorarioRequestDTO novo) {
        return existente.getHorarioInicio().isBefore(novo.getHorarioFim())
                && novo.getHorarioInicio().isBefore(existente.getHorarioFim());
    }

    private String normalizarSala(String sala) {
        return sala == null || sala.isBlank() ? null : sala.trim();
    }
}