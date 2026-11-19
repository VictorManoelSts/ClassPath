package com.classpath.academico.service;

import com.classpath.academico.dto.HorarioRequestDTO;
import com.classpath.academico.exception.BusinessRuleException;
import com.classpath.academico.model.Disciplina;
import com.classpath.academico.model.Horario;
import com.classpath.academico.repository.HorarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HorarioServiceTest {

    private static final String SEGUNDA = "Segunda-feira";
    private static final String SALA = "Sala 01";

    @Mock
    private HorarioRepository horarioRepository;

    @Mock
    private DisciplinaService disciplinaService;

    @InjectMocks
    private HorarioService horarioService;

    @ParameterizedTest
    @CsvSource({
            "08:00, 10:00", // Mesmo intervalo
            "09:00, 11:00", // Sobreposição parcial
            "08:30, 09:30", // Novo intervalo contido no existente
            "07:00, 11:00"  // Novo intervalo contém o existente
    })
    void rejeitaSobreposicaoNaMesmaSalaMesmoComOutraDisciplina(String inicio, String fim) {
        when(horarioRepository.findByDiaSemana(SEGUNDA)).thenReturn(List.of(horarioExistente(1L, SALA)));

        assertThrows(BusinessRuleException.class,
                () -> horarioService.criar(requisicao(SEGUNDA, inicio, fim, SALA)));
        verify(horarioRepository, never()).save(any());
    }

    @Test
    void permiteHorariosSimultaneosEmSalasDiferentes() {
        when(horarioRepository.findByDiaSemana(SEGUNDA)).thenReturn(List.of(horarioExistente(1L, SALA)));
        prepararSalvamento();

        assertEquals("Sala 02",
                horarioService.criar(requisicao(SEGUNDA, "08:00", "10:00", "Sala 02")).getSala());
    }

    @Test
    void permiteMesmaSalaEmDiasDiferentes() {
        String terca = "Terça-feira";
        when(horarioRepository.findByDiaSemana(terca)).thenReturn(List.of());
        prepararSalvamento();

        assertEquals(terca, horarioService.criar(requisicao(terca, "08:00", "10:00", SALA)).getDiaSemana());
        verify(horarioRepository).findByDiaSemana(terca);
    }

    @ParameterizedTest
    @CsvSource({"06:00, 08:00", "10:00, 12:00"})
    void permiteHorariosConsecutivosNaMesmaSala(String inicio, String fim) {
        when(horarioRepository.findByDiaSemana(SEGUNDA)).thenReturn(List.of(horarioExistente(1L, SALA)));
        prepararSalvamento();

        assertEquals(LocalTime.parse(inicio),
                horarioService.criar(requisicao(SEGUNDA, inicio, fim, SALA)).getHorarioInicio());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void permiteCadastroSemSala(String sala) {
        prepararSalvamento();

        assertNull(horarioService.criar(requisicao(SEGUNDA, "08:00", "10:00", sala)).getSala());
        verify(horarioRepository, never()).findByDiaSemana(any());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "   ")
    void ignoraHorarioExistenteSemSala(String salaExistente) {
        when(horarioRepository.findByDiaSemana(SEGUNDA)).thenReturn(List.of(horarioExistente(1L, salaExistente)));
        prepararSalvamento();

        assertEquals(SALA, horarioService.criar(requisicao(SEGUNDA, "08:00", "10:00", SALA)).getSala());
    }

    @Test
    void comparaSalasSemDistinguirCaixaOuEspacosNasExtremidades() {
        when(horarioRepository.findByDiaSemana(SEGUNDA)).thenReturn(List.of(horarioExistente(1L, " Sala 01 ")));

        assertThrows(BusinessRuleException.class,
                () -> horarioService.criar(requisicao(SEGUNDA, "08:00", "10:00", " sala 01 ")));
    }

    @Test
    void permiteAtualizacaoQueSobrepoeApenasOProprioRegistro() {
        Horario existente = horarioExistente(1L, SALA);
        when(horarioRepository.findByDiaSemana(SEGUNDA)).thenReturn(List.of(existente));
        when(horarioRepository.findById(1L)).thenReturn(Optional.of(existente));
        prepararSalvamento();

        assertEquals(LocalTime.of(9, 0),
                horarioService.atualizar(1L, requisicao(SEGUNDA, "09:00", "11:00", SALA)).getHorarioInicio());
        verify(horarioRepository).save(existente);
    }

    @Test
    void rejeitaAtualizacaoQueSobrepoeOutroRegistroNaMesmaSala() {
        when(horarioRepository.findByDiaSemana(SEGUNDA))
                .thenReturn(List.of(horarioExistente(1L, SALA), horarioExistente(2L, SALA)));

        assertThrows(BusinessRuleException.class,
                () -> horarioService.atualizar(1L, requisicao(SEGUNDA, "09:00", "11:00", SALA)));
        verify(horarioRepository, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"08:00", "09:00"})
    void rejeitaInicioIgualOuPosteriorAoFimNoCadastroENaAtualizacao(String inicio) {
        HorarioRequestDTO dto = requisicao(SEGUNDA, inicio, "08:00", null);

        assertThrows(BusinessRuleException.class, () -> horarioService.criar(dto));
        assertThrows(BusinessRuleException.class, () -> horarioService.atualizar(1L, dto));
        verify(horarioRepository, never()).save(any());
    }

    private void prepararSalvamento() {
        Disciplina disciplina = new Disciplina("Matemática", "Maria");
        disciplina.setId(2L);
        when(disciplinaService.buscarPorId(2L)).thenReturn(disciplina);
        when(horarioRepository.save(any(Horario.class))).thenAnswer(invocacao -> invocacao.getArgument(0));
    }

    private Horario horarioExistente(Long id, String sala) {
        Disciplina disciplina = new Disciplina("História", "José");
        disciplina.setId(1L);
        Horario horario = new Horario(disciplina, SEGUNDA, LocalTime.of(8, 0), LocalTime.of(10, 0), sala);
        horario.setId(id);
        return horario;
    }

    private HorarioRequestDTO requisicao(String dia, String inicio, String fim, String sala) {
        HorarioRequestDTO dto = new HorarioRequestDTO();
        dto.setDisciplinaId(2L);
        dto.setDiaSemana(dia);
        dto.setHorarioInicio(LocalTime.parse(inicio));
        dto.setHorarioFim(LocalTime.parse(fim));
        dto.setSala(sala);
        return dto;
    }
}
