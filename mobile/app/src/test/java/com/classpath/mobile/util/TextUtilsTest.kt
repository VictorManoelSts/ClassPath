package com.classpath.mobile.util

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Cobre o caso que motivou normalizedForMatch(): o campo Material.disciplina
 * é texto livre digitado no Back Materiais, então precisa casar com o nome
 * da disciplina do Back Acadêmico mesmo com diferenças de acento, caixa ou
 * espaçamento entre os dois.
 */
class TextUtilsTest {

    @Test
    fun `ignora diferenca de caixa`() {
        assertEquals("banco de dados", "Banco de Dados".normalizedForMatch())
        assertEquals("BANCO DE DADOS".normalizedForMatch(), "banco de dados".normalizedForMatch())
    }

    @Test
    fun `ignora acentuacao`() {
        assertEquals("introducao ao react", "Introdução ao React".normalizedForMatch())
        assertEquals("banco de dados", "Bánco de Dádos".normalizedForMatch())
    }

    @Test
    fun `remove espacos nas pontas e colapsa espacos duplicados`() {
        assertEquals("redes de computadores", "  Redes   de Computadores  ".normalizedForMatch())
    }

    @Test
    fun `nomes iguais so na forma normalizada batem no filtro`() {
        val nomeDisciplina = "Banco de Dados"
        val nomeDigitadoNoBackMateriais = " banco   DE dádos "
        assertEquals(nomeDisciplina.normalizedForMatch(), nomeDigitadoNoBackMateriais.normalizedForMatch())
    }

    @Test
    fun `nomes diferentes continuam nao batendo`() {
        assertEquals(false, "Banco de Dados".normalizedForMatch() == "Redes de Computadores".normalizedForMatch())
    }
}
