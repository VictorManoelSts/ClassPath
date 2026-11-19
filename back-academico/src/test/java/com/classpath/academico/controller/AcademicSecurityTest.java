package com.classpath.academico.controller;

import com.classpath.academico.AcademicSecurityFixture;
import com.classpath.academico.config.CorsConfig;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AcademicSecurityTest extends AcademicSecurityFixture {
    @Autowired
    MockMvc mvc;

    @ParameterizedTest
    @ValueSource(strings = {"disciplinas", "horarios", "avisos"})
    void publicReadsAndProtectedWrites(String resource) throws Exception {
        String path = "/api/" + resource;
        mvc.perform(get(path)).andExpect(status().isOk());
        mvc.perform(post(path)).andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"));
        mvc.perform(put(path + "/1")).andExpect(status().isUnauthorized());
        mvc.perform(delete(path + "/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsInvalidCredentialAndProtectsDocumentation() throws Exception {
        mvc.perform(post("/api/disciplinas").header("Authorization",
                        "Bearer classpath-test-only-wrong-token-for-authentication"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/v3/api-docs")).andExpect(status().isUnauthorized());
        mvc.perform(get("/v3/api-docs").header("Authorization", AUTHORIZATION))
                .andExpect(status().isOk());
        mvc.perform(get("/private").header("Authorization", AUTHORIZATION))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void authenticatedUserWithoutAdminRoleIsForbidden() throws Exception {
        mvc.perform(post("/api/disciplinas")).andExpect(status().isForbidden());
        mvc.perform(get("/v3/api-docs")).andExpect(status().isForbidden());
        mvc.perform(get("/private")).andExpect(status().isForbidden());
    }

    @Test
    void corsAllowsOnlyConfiguredReadOrigins() throws Exception {
        mvc.perform(get("/api/disciplinas").header("Origin", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
        mvc.perform(get("/api/disciplinas").header("Origin", "https://other.invalid"))
                .andExpect(status().isForbidden());
        mvc.perform(options("/api/disciplinas").header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {"*", "https://*.example.test", "https://example.test/path",
            "https://user@example.test", "https://example.test,", "null"})
    void rejectsInvalidCorsOrigins(String origin) {
        assertThatIllegalArgumentException().isThrownBy(() -> new CorsConfig(origin));
    }
}