package com.classpath.academico.controller;

import com.classpath.academico.dto.DisciplinaRequestDTO;
import com.classpath.academico.dto.DisciplinaResponseDTO;
import com.classpath.academico.service.DisciplinaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disciplinas")
public class DisciplinaController {

    private final DisciplinaService disciplinaService;

    public DisciplinaController(DisciplinaService disciplinaService) {
        this.disciplinaService = disciplinaService;
    }

    @GetMapping
    public List<DisciplinaResponseDTO> listar() {
        return disciplinaService.listar();
    }

    @GetMapping("/{id}")
    public DisciplinaResponseDTO buscarPorId(@PathVariable Long id) {
        return disciplinaService.detalhar(id);
    }

    @PostMapping
    public ResponseEntity<DisciplinaResponseDTO> criar(@Valid @RequestBody DisciplinaRequestDTO dados) {
        DisciplinaResponseDTO salva = disciplinaService.criar(dados);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    @PutMapping("/{id}")
    public DisciplinaResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody DisciplinaRequestDTO dados) {
        return disciplinaService.atualizar(id, dados);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        disciplinaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
