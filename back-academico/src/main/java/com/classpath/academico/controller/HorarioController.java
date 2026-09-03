package com.classpath.academico.controller;

import com.classpath.academico.dto.HorarioRequestDTO;
import com.classpath.academico.dto.HorarioResponseDTO;
import com.classpath.academico.exception.BusinessRuleException;
import com.classpath.academico.exception.ResourceNotFoundException;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.model.Horario;
import com.classpath.academico.repository.DisciplinaRepository;
import com.classpath.academico.repository.HorarioRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/horarios")
public class HorarioController {

    private final HorarioRepository horarioRepository;
    private final DisciplinaRepository disciplinaRepository;

    public HorarioController(
            HorarioRepository horarioRepository,
            DisciplinaRepository disciplinaRepository
    ) {
        this.horarioRepository = horarioRepository;
        this.disciplinaRepository = disciplinaRepository;
    }

    @GetMapping
    public List<HorarioResponseDTO> listar(@RequestParam(required = false) Long disciplinaId) {
        List<Horario> horarios = disciplinaId == null
                ? horarioRepository.findAll()
                : horarioRepository.findByDisciplinaId(disciplinaId);

        return horarios.stream().map(HorarioResponseDTO::new).toList();
    }

    @GetMapping("/{id}")
    public HorarioResponseDTO buscarPorId(@PathVariable Long id) {
        return new HorarioResponseDTO(buscarHorario(id));
    }

    @PostMapping
    public ResponseEntity<HorarioResponseDTO> criar(@Valid @RequestBody HorarioRequestDTO dto) {
        validarIntervalo(dto);
        Disciplina disciplina = buscarDisciplina(dto.getDisciplinaId());

        Horario horario = new Horario(
                disciplina,
                dto.getDiaSemana().trim(),
                dto.getHorarioInicio(),
                dto.getHorarioFim(),
                normalizarSala(dto.getSala())
        );

        Horario salvo = horarioRepository.save(horario);
        return ResponseEntity.status(HttpStatus.CREATED).body(new HorarioResponseDTO(salvo));
    }

    @PutMapping("/{id}")
    public HorarioResponseDTO atualizar(
            @PathVariable Long id,
            @Valid @RequestBody HorarioRequestDTO dto
    ) {
        validarIntervalo(dto);
        Horario horario = buscarHorario(id);
        Disciplina disciplina = buscarDisciplina(dto.getDisciplinaId());

        horario.setDisciplina(disciplina);
        horario.setDiaSemana(dto.getDiaSemana().trim());
        horario.setHorarioInicio(dto.getHorarioInicio());
        horario.setHorarioFim(dto.getHorarioFim());
        horario.setSala(normalizarSala(dto.getSala()));

        return new HorarioResponseDTO(horarioRepository.save(horario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Horario horario = buscarHorario(id);
        horarioRepository.delete(horario);
        return ResponseEntity.noContent().build();
    }

    private Horario buscarHorario(Long id) {
        return horarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horário não encontrado: " + id));
    }

    private Disciplina buscarDisciplina(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada: " + id));
    }

    private void validarIntervalo(HorarioRequestDTO dto) {
        if (!dto.getHorarioInicio().isBefore(dto.getHorarioFim())) {
            throw new BusinessRuleException("O horário de início deve ser anterior ao horário de fim");
        }
    }

    private String normalizarSala(String sala) {
        return sala == null || sala.isBlank() ? null : sala.trim();
    }
}
