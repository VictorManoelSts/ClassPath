package com.classpath.academico.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfig {
    @Bean
    static BeanFactoryPostProcessor requirePostgresPassword(Environment environment) {
        return factory -> {
            String url = environment.getRequiredProperty("spring.datasource.url");
            if (url.startsWith("jdbc:postgresql:")
                    && environment.getRequiredProperty("spring.datasource.password").isBlank()) {
                throw new IllegalStateException("Configure DATABASE_PASSWORD com um valor nao vazio");
            }
        };
    }
}
