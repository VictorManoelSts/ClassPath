package com.portalturma.academico.controller;

import com.portalturma.academico.exception.ResourceConflictException;
import com.portalturma.academico.exception.ResourceNotFoundException;
import com.portalturma.academico.model.Disciplina;
import com.portalturma.academico.repository.AvisoRepository;
import com.portalturma.academico.repository.DisciplinaRepository;
import com.portalturma.academico.repository.HorarioRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disciplinas")
public class DisciplinaController {

    private final DisciplinaRepository disciplinaRepository;
    private final HorarioRepository horarioRepository;
    private final AvisoRepository avisoRepository;

    public DisciplinaController(
            DisciplinaRepository disciplinaRepository,
            HorarioRepository horarioRepository,
            AvisoRepository avisoRepository
    ) {
        this.disciplinaRepository = disciplinaRepository;
        this.horarioRepository = horarioRepository;
        this.avisoRepository = avisoRepository;
    }

    @GetMapping
    public List<Disciplina> listar() {
        return disciplinaRepository.findAll(Sort.by("nome"));
    }

    @GetMapping("/{id}")
    public Disciplina buscarPorId(@PathVariable Long id) {
        return buscarDisciplina(id);
    }

    @PostMapping
    public ResponseEntity<Disciplina> criar(@Valid @RequestBody Disciplina dados) {
        Disciplina disciplina = new Disciplina(dados.getNome().trim(), dados.getProfessor().trim());
        Disciplina salva = disciplinaRepository.save(disciplina);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @PutMapping("/{id}")
    public Disciplina atualizar(@PathVariable Long id, @Valid @RequestBody Disciplina dados) {
        Disciplina disciplina = buscarDisciplina(id);
        disciplina.setNome(dados.getNome().trim());
        disciplina.setProfessor(dados.getProfessor().trim());
        return disciplinaRepository.save(disciplina);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Disciplina disciplina = buscarDisciplina(id);

        if (horarioRepository.existsByDisciplinaId(id) || avisoRepository.existsByDisciplinaId(id)) {
            throw new ResourceConflictException(
                    "A disciplina não pode ser excluída porque possui horários ou avisos associados"
            );
        }

        disciplinaRepository.delete(disciplina);
        return ResponseEntity.noContent().build();
    }

    private Disciplina buscarDisciplina(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada: " + id));
    }
}
