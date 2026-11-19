package com.classpath.academico.config;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.DefaultOAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.server.resource.introspection.BadOpaqueTokenException;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Configuration
public class SecurityConfig {
    static final String[] PUBLIC_PATHS = {
            "/api/disciplinas", "/api/disciplinas/{id}",
            "/api/horarios", "/api/horarios/{id}",
            "/api/avisos", "/api/avisos/{id}"
    };
    private static final String[] DOCS = {"/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**", "/v3/api-docs.yaml"};

    @Bean
    SecurityFilterChain apiSecurity(
            HttpSecurity http,
            @Value("${ACADEMIC_ADMIN_TOKEN_HASH}") String tokenHash) throws Exception {
        if (!tokenHash.matches("\\$2[aby]\\$(1[0-4])\\$[./A-Za-z0-9]{53}")) {
            throw new IllegalArgumentException("ACADEMIC_ADMIN_TOKEN_HASH deve ser um hash BCrypt com custo entre 10 e 14");
        }

        RequestMatcher writes = new OrRequestMatcher(
                paths(HttpMethod.POST, PUBLIC_PATHS), paths(HttpMethod.PUT, PUBLIC_PATHS),
                paths(HttpMethod.DELETE, PUBLIC_PATHS));
        RequestMatcher docs = paths(HttpMethod.GET, DOCS);
        RequestMatcher protectedPaths = new OrRequestMatcher(writes, docs);
        DefaultBearerTokenResolver bearer = new DefaultBearerTokenResolver();
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        return http
                .cors(cors -> {})
                // Only these writes bypass CSRF. They require a bearer header, never cookies or browser-cached Basic credentials.
                .csrf(csrf -> csrf.ignoringRequestMatchers(writes))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(paths(HttpMethod.GET, PUBLIC_PATHS), paths(HttpMethod.HEAD, PUBLIC_PATHS)).permitAll()
                        .requestMatchers(writes, docs).hasRole("ADMIN")
                        .anyRequest().denyAll())
                .addFilterBefore(limitAuthentication(protectedPaths), BearerTokenAuthenticationFilter.class)
                .oauth2ResourceServer(oauth -> oauth
                        .bearerTokenResolver(request -> protectedPaths.matches(request) ? bearer.resolve(request) : null)
                        .opaqueToken(opaque ->
                        opaque.introspector(token -> authenticate(token, tokenHash, encoder))))
                .build();
    }

    private static RequestMatcher paths(HttpMethod method, String[] patterns) {
        return new OrRequestMatcher(Arrays.stream(patterns)
                .map(path -> (RequestMatcher) PathPatternRequestMatcher.withDefaults().matcher(method, path))
                .toList());
    }

    private static OAuth2AuthenticatedPrincipal authenticate(String token, String hash, BCryptPasswordEncoder encoder) {
        if (!token.matches("[A-Za-z0-9_-]{43,72}") || !encoder.matches(token, hash)) {
            throw new BadOpaqueTokenException("Credencial invalida");
        }
        return new DefaultOAuth2AuthenticatedPrincipal("classpath-bff", Map.of("sub", "classpath-bff"),
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    }

    private static Filter limitAuthentication(RequestMatcher protectedPaths) {
        return new org.springframework.web.filter.OncePerRequestFilter() {
            private long windowStart = System.nanoTime();
            private int requests;

            private synchronized boolean allow() {
                long now = System.nanoTime();
                if (now - windowStart >= TimeUnit.MINUTES.toNanos(1)) {
                    windowStart = now;
                    requests = 0;
                }
                if (requests >= 120) {
                    return false;
                }
                requests++;
                return true;
            }

            @Override
            protected void doFilterInternal(jakarta.servlet.http.HttpServletRequest request,
                                            HttpServletResponse response, jakarta.servlet.FilterChain chain)
                    throws java.io.IOException, jakarta.servlet.ServletException {
                if (protectedPaths.matches(request) && request.getHeader("Authorization") != null && !allow()) {
                    response.setStatus(429);
                    response.setHeader("Retry-After", "60");
                    return;
                }
                chain.doFilter(request, response);
            }
        };
    }
}
