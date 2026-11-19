package com.classpath.academico.service;

import com.classpath.academico.dto.DisciplinaRequestDTO;
import com.classpath.academico.dto.DisciplinaResponseDTO;
import com.classpath.academico.exception.ResourceConflictException;
import com.classpath.academico.exception.ResourceNotFoundException;
import com.classpath.academico.exception.BusinessRuleException;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.repository.AvisoRepository;
import com.classpath.academico.repository.DisciplinaRepository;
import com.classpath.academico.repository.HorarioRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DisciplinaService {

    private final DisciplinaRepository disciplinaRepository;
    private final HorarioRepository horarioRepository;
    private final AvisoRepository avisoRepository;

    public DisciplinaService(
            DisciplinaRepository disciplinaRepository,
            HorarioRepository horarioRepository,
            AvisoRepository avisoRepository
    ) {
        this.disciplinaRepository = disciplinaRepository;
        this.horarioRepository = horarioRepository;
        this.avisoRepository = avisoRepository;
    }

    public List<DisciplinaResponseDTO> listar() {
        return disciplinaRepository.findAll(Sort.by("nome")).stream()
                .map(DisciplinaResponseDTO::new)
                .toList();
    }

    public DisciplinaResponseDTO detalhar(Long id) {
        return new DisciplinaResponseDTO(buscarPorId(id));
    }

    public Disciplina buscarPorId(Long id) {
        return disciplinaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disciplina não encontrada: " + id));
    }

    public DisciplinaResponseDTO criar(DisciplinaRequestDTO dados) {
        validarDados(dados);

        Disciplina disciplina = new Disciplina(dados.getNome().trim(), dados.getProfessor().trim());
        return new DisciplinaResponseDTO(disciplinaRepository.save(disciplina));
    }

    public DisciplinaResponseDTO atualizar(Long id, DisciplinaRequestDTO dados) {
        Disciplina disciplina = buscarPorId(id);
        validarDados(dados);

        disciplina.setNome(dados.getNome().trim());
        disciplina.setProfessor(dados.getProfessor().trim());

        return new DisciplinaResponseDTO(disciplinaRepository.save(disciplina));
    }

    public void excluir(Long id) {
        Disciplina disciplina = buscarPorId(id);

        if (horarioRepository.existsByDisciplinaId(id) || avisoRepository.existsByDisciplinaId(id)) {
            throw new ResourceConflictException(
                    "A disciplina não pode ser excluída porque possui horários ou avisos associados"
            );
        }

        disciplinaRepository.delete(disciplina);
    }

    private void validarDados(DisciplinaRequestDTO dados) {
        if (dados == null) {
            throw new BusinessRuleException(
                    "Os dados da disciplina são obrigatórios"
            );
        }

        if (dados.getNome() == null || dados.getNome().isBlank()) {
            throw new BusinessRuleException(
                    "O nome da disciplina é obrigatório"
            );
        }

        if (dados.getProfessor() == null || dados.getProfessor().isBlank()) {
            throw new BusinessRuleException(
                    "O nome do professor é obrigatório"
            );
        }
    }

}
