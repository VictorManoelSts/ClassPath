package com.classpath.academico.config;

import java.net.URI;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    private final String[] allowedOrigins;

    public CorsConfig(@Value("${CORS_ALLOWED_ORIGINS:}") String origins) {
        allowedOrigins = origins.isBlank() ? new String[0] : Arrays.stream(origins.split(",", -1))
                .map(String::trim).map(CorsConfig::validateOrigin).distinct().toArray(String[]::new);
    }

    private static String validateOrigin(String value) {
        URI origin;
        try {
            origin = URI.create(value);
        } catch (IllegalArgumentException ignored) {
            throw new IllegalArgumentException("CORS_ALLOWED_ORIGINS deve conter origens HTTP(S) explicitas");
        }
        if (!("http".equals(origin.getScheme()) || "https".equals(origin.getScheme()))
                || origin.getHost() == null || origin.getPort() > 65535
                || (origin.getPort() == -1 && origin.getRawAuthority().endsWith(":"))
                || origin.getRawUserInfo() != null || !origin.getRawPath().isEmpty()
                || origin.getRawQuery() != null || origin.getRawFragment() != null) {
            throw new IllegalArgumentException("CORS_ALLOWED_ORIGINS deve conter origens HTTP(S) explicitas");
        }
        return value;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        for (String path : SecurityConfig.PUBLIC_PATHS) {
            registry.addMapping(path).allowedOrigins(allowedOrigins)
                    .allowedMethods("GET", "HEAD")
                    .allowedHeaders("Accept", "Content-Type")
                    .allowCredentials(false);
        }
    }
}
