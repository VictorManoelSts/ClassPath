package com.classpath.academico;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

public abstract class AcademicSecurityFixture {
    protected static final String TOKEN = "classpath-test-only-token-with-no-production-use";
    protected static final String AUTHORIZATION = "Bearer " + TOKEN;

    @DynamicPropertySource
    static void securityProperties(DynamicPropertyRegistry properties) {
        String hash = new BCryptPasswordEncoder().encode(TOKEN);
        properties.add("ACADEMIC_ADMIN_TOKEN_HASH", () -> hash);
        properties.add("CORS_ALLOWED_ORIGINS", () -> "http://localhost:5173");
    }
}