package com.classpath.academico.controller;

import com.classpath.academico.dto.HorarioRequestDTO;
import com.classpath.academico.dto.HorarioResponseDTO;
import com.classpath.academico.service.HorarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/horarios")
public class HorarioController {

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @GetMapping
    public List<HorarioResponseDTO> listar(@RequestParam(required = false) Long disciplinaId) {
        return horarioService.listar(disciplinaId);
    }

    @GetMapping("/{id}")
    public HorarioResponseDTO buscarPorId(@PathVariable Long id) {
        return horarioService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<HorarioResponseDTO> criar(@Valid @RequestBody HorarioRequestDTO dto) {
        HorarioResponseDTO salvo = horarioService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public HorarioResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody HorarioRequestDTO dto) {
        return horarioService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        horarioService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}