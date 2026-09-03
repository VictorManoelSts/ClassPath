package com.portalturma.academico;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada do Back-end Acadêmico.
 *
 * Este back-end é responsável pelos dados estruturados do sistema:
 * disciplinas, professores, horários e avisos (ver seção 7 da arquitetura).
 * Utiliza PostgreSQL como banco de dados (banco SQL exigido pelo trabalho).
 */
@SpringBootApplication
public class AcademicoApplication {

    public static void main(String[] args) {
        SpringApplication.run(AcademicoApplication.class, args);
    }

}
