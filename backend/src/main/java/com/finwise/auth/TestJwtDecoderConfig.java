package com.finwise.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/**
 * Test profile only: tests never call Okta. Authenticated requests use spring-security-test's
 * jwt() post-processor; any real bearer token is rejected, which exercises the 401 path.
 */
@Configuration
@Profile("test")
class TestJwtDecoderConfig {

    @Bean
    JwtDecoder jwtDecoder() {
        return token -> {
            throw new BadJwtException("Tokens are mocked in the test profile");
        };
    }
}
