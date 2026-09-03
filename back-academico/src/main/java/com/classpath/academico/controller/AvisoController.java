package com.classpath.academico.controller;

import com.classpath.academico.dto.AvisoRequestDTO;
import com.classpath.academico.dto.AvisoResponseDTO;
import com.classpath.academico.exception.ResourceNotFoundException;
import com.classpath.academico.model.Aviso;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.repository.AvisoRepository;
import com.classpath.academico.repository.DisciplinaRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/avisos")
public class AvisoController {

    private final AvisoRepository avisoRepository;
    private final DisciplinaRepository disciplinaRepository;

    public AvisoController(
            AvisoRepository avisoRepository,
            DisciplinaRepository disciplinaRepository
    ) {
        this.avisoRepository = avisoRepository;
        this.disciplinaRepository = disciplinaRepository;
    }
    @GetMapping
    public List<AvisoResponseDTO> listar(@RequestParam(required = false) Long disciplinaId) {
        List<Aviso> avisos = disciplinaId == null
                ? avisoRepository.findAllByOrderByDataPublicacaoDesc()
                : avisoRepository.findByDisciplinaIdOrderByDataPublicacaoDesc(disciplinaId);

        return avisos.stream().map(AvisoResponseDTO::new).toList();
    }

    @GetMapping("/{id}")
    public AvisoResponseDTO buscarPorId(@PathVariable Long id) {
        return new AvisoResponseDTO(buscarAviso(id));
    }

    @PostMapping
    public ResponseEntity<AvisoResponseDTO> criar(@Valid @RequestBody AvisoRequestDTO dto) {
        Disciplina disciplina = buscarDisciplina(dto.getDisciplinaId());

        Aviso aviso = new Aviso(
                dto.getTitulo().trim(),
                dto.getDescricao().trim(),
                disciplina,
                dto.getDataPublicacao()
        );

        Aviso salvo = avisoRepository.save(aviso);
        return ResponseEntity.status(HttpStatus.CREATED).body(new AvisoResponseDTO(salvo));
    }

    @PutMapping("/{id}")
    public AvisoResponseDTO atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AvisoRequestDTO dto
    ) {
        Aviso aviso = buscarAviso(id);
        Disciplina disciplina = buscarDisciplina(dto.getDisciplinaId());

        aviso.setTitulo(dto.getTitulo().trim());
        aviso.setDescricao(dto.getDescricao().trim());
        aviso.setDisciplina(disciplina);
        aviso.setDataPublicacao(dto.getDataPublicacao());

        return new AvisoResponseDTO(avisoRepository.save(aviso));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Aviso aviso = buscarAviso(id);
        avisoRepository.delete(aviso);
        return ResponseEntity.noContent().build();
    }

    private Aviso buscarAviso(Long id) {
        return avisoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aviso não encontrado: " + id));
    }

    private Disciplina buscarDisciplina(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada: " + id));
    }
}
