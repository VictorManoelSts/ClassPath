package com.classpath.mobile.util

import java.text.Normalizer

/**
 * Normaliza texto para comparações "tolerantes" (ignora acentuação, caixa e
 * espaços nas pontas/duplicados).
 *
 * Usado principalmente pelo filtro de Materiais: o campo `Material.disciplina`
 * é texto livre digitado no Back Materiais, sem vínculo com o Back Acadêmico,
 * então pequenas diferenças de digitação ("Banco de Dados " vs "banco de dados")
 * não podem fazer o filtro simplesmente não encontrar nada.
 */
fun String.normalizedForMatch(): String {
    val semAcento = Normalizer.normalize(this, Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
    return semAcento
        .trim()
        .lowercase()
        .replace(Regex("\\s+"), " ")
}
