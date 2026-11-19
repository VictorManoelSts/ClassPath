package com.classpath.academico.controller;

import com.classpath.academico.model.Aviso;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.model.Horario;
import com.classpath.academico.repository.AvisoRepository;
import com.classpath.academico.repository.DisciplinaRepository;
import com.classpath.academico.repository.HorarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DisciplinaControllerTest {

    private static final String URL = "/api/disciplinas";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private DisciplinaRepository disciplinaRepository;

    @Autowired
    private HorarioRepository horarioRepository;

    @Autowired
    private AvisoRepository avisoRepository;

    @Test
    void cadastraDisciplinaComJsonCompativel() throws Exception {
        MvcResult resultado = mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":" Matemática ","professor":" Maria "}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn();

        List<Disciplina> disciplinas = disciplinaRepository.findAll();
        assertThat(disciplinas).hasSize(1);
        Disciplina salva = disciplinas.get(0);
        assertThat(salva.getNome()).isEqualTo("Matemática");
        assertThat(salva.getProfessor()).isEqualTo("Maria");
        content().json(jsonDisciplina(salva.getId(), "Matemática", "Maria"), true).match(resultado);
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "nome | null | \"Maria\"",
            "nome | \"\" | \"Maria\"",
            "professor | \"Matemática\" | null",
            "professor | \"Matemática\" | \"\""
    })
    void rejeitaCamposObrigatoriosInvalidosNoCadastroENaAtualizacao(
            String campo, String nomeJson, String professorJson) throws Exception {
        String corpo = """
                {"nome":%s,"professor":%s}
                """.formatted(nomeJson, professorJson);
        Disciplina existente = disciplinaRepository.save(new Disciplina("História", "Ana"));

        mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos." + campo).isString());
        mvc.perform(put(URL + "/{id}", existente.getId()).contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos." + campo).isString());
    }

    @Test
    void atualizaDisciplinaPeloIdDaUrl() throws Exception {
        Disciplina existente = disciplinaRepository.save(new Disciplina("História", "Ana"));

        mvc.perform(put(URL + "/{id}", existente.getId()).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"id":-1,"nome":" Geografia ","professor":" José "}
                                """))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDisciplina(existente.getId(), "Geografia", "José"), true));

        assertThat(disciplinaRepository.findById(existente.getId()).orElseThrow().getNome()).isEqualTo("Geografia");
    }

    @Test
    void buscaDisciplinaPorId() throws Exception {
        Disciplina disciplina = disciplinaRepository.save(new Disciplina("História", "Ana"));

        mvc.perform(get(URL + "/{id}", disciplina.getId()))
                .andExpect(status().isOk())
                .andExpect(content().json(jsonDisciplina(disciplina.getId(), "História", "Ana"), true));
    }

    @Test
    void listaDisciplinasOrdenadasPorNome() throws Exception {
        Disciplina matematica = disciplinaRepository.save(new Disciplina("Matemática", "Maria"));
        Disciplina historia = disciplinaRepository.save(new Disciplina("História", "Ana"));
        String esperado = "[%s,%s]".formatted(
                jsonDisciplina(historia.getId(), "História", "Ana"),
                jsonDisciplina(matematica.getId(), "Matemática", "Maria"));

        mvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(content().json(esperado, true));
    }

    @Test
    void excluiDisciplinaSemRelacionamentos() throws Exception {
        Disciplina disciplina = disciplinaRepository.save(new Disciplina("História", "Ana"));

        mvc.perform(delete(URL + "/{id}", disciplina.getId()))
                .andExpect(status().isNoContent());

        assertThat(disciplinaRepository.existsById(disciplina.getId())).isFalse();
    }

    @Test
    void bloqueiaExclusaoDeDisciplinaComHorario() throws Exception {
        Disciplina disciplina = disciplinaRepository.save(new Disciplina("História", "Ana"));
        horarioRepository.save(new Horario(disciplina, "Segunda-feira", LocalTime.of(8, 0), LocalTime.of(10, 0), null));

        verificarExclusaoBloqueada(disciplina.getId());
    }

    @Test
    void bloqueiaExclusaoDeDisciplinaComAviso() throws Exception {
        Disciplina disciplina = disciplinaRepository.save(new Disciplina("História", "Ana"));
        avisoRepository.save(new Aviso("Prova", "Revisar o capítulo 1", disciplina, LocalDate.of(2026, 11, 18)));

        verificarExclusaoBloqueada(disciplina.getId());
    }

    private void verificarExclusaoBloqueada(Long id) throws Exception {
        mvc.perform(delete(URL + "/{id}", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(
                        "A disciplina não pode ser excluída porque possui horários ou avisos associados"));

        assertThat(disciplinaRepository.existsById(id)).isTrue();
    }

    private String jsonDisciplina(Long id, String nome, String professor) {
        return """
                {"id":%d,"nome":"%s","professor":"%s"}
                """.formatted(id, nome, professor);
    }
}
