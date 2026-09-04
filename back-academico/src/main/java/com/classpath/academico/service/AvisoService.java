package com.classpath.academico.service;

import com.classpath.academico.dto.AvisoRequestDTO;
import com.classpath.academico.dto.AvisoResponseDTO;
import com.classpath.academico.exception.ResourceNotFoundException;
import com.classpath.academico.model.Aviso;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.repository.AvisoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AvisoService {

    private final AvisoRepository avisoRepository;
    private final DisciplinaService disciplinaService;

    public AvisoService(AvisoRepository avisoRepository, DisciplinaService disciplinaService) {
        this.avisoRepository = avisoRepository;
        this.disciplinaService = disciplinaService;
    }

    public List<AvisoResponseDTO> listar(Long disciplinaId) {
        List<Aviso> avisos = disciplinaId == null
                ? avisoRepository.findAllByOrderByDataPublicacaoDesc()
                : avisoRepository.findByDisciplinaIdOrderByDataPublicacaoDesc(disciplinaId);

        return avisos.stream().map(AvisoResponseDTO::new).toList();
    }

    public AvisoResponseDTO buscarPorId(Long id) {
        return new AvisoResponseDTO(buscarAviso(id));
    }

    public AvisoResponseDTO criar(AvisoRequestDTO dto) {
        Disciplina disciplina = disciplinaService.buscarPorId(dto.getDisciplinaId());

        Aviso aviso = new Aviso(
                dto.getTitulo().trim(),
                dto.getDescricao().trim(),
                disciplina,
                dto.getDataPublicacao()
        );

        return new AvisoResponseDTO(avisoRepository.save(aviso));
    }

    public AvisoResponseDTO atualizar(Long id, AvisoRequestDTO dto) {
        Aviso aviso = buscarAviso(id);
        Disciplina disciplina = disciplinaService.buscarPorId(dto.getDisciplinaId());

        aviso.setTitulo(dto.getTitulo().trim());
        aviso.setDescricao(dto.getDescricao().trim());
        aviso.setDisciplina(disciplina);
        aviso.setDataPublicacao(dto.getDataPublicacao());

        return new AvisoResponseDTO(avisoRepository.save(aviso));
    }

    public void excluir(Long id) {
        Aviso aviso = buscarAviso(id);
        avisoRepository.delete(aviso);
    }

    private Aviso buscarAviso(Long id) {
        return avisoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Aviso não encontrado: " + id));
    }
}