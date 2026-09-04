package com.classpath.academico.controller;

import com.classpath.academico.dto.AvisoRequestDTO;
import com.classpath.academico.dto.AvisoResponseDTO;
import com.classpath.academico.service.AvisoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/avisos")
public class AvisoController {

    private final AvisoService avisoService;

    public AvisoController(AvisoService avisoService) {
        this.avisoService = avisoService;
    }

    @GetMapping
    public List<AvisoResponseDTO> listar(@RequestParam(required = false) Long disciplinaId) {
        return avisoService.listar(disciplinaId);
    }

    @GetMapping("/{id}")
    public AvisoResponseDTO buscarPorId(@PathVariable Long id) {
        return avisoService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<AvisoResponseDTO> criar(@Valid @RequestBody AvisoRequestDTO dto) {
        AvisoResponseDTO salvo = avisoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public AvisoResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody AvisoRequestDTO dto) {
        return avisoService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        avisoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}