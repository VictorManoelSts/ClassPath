package com.classpath.academico.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ClassPath API - Back Acadêmico")
                        .version("1.0.0")
                        .description("API REST para gerenciamento de disciplinas, horários e avisos do sistema ClassPath."));
    }
}