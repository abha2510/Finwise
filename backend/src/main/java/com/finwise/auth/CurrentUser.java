package com.finwise.auth;

import com.finwise.user.User;
import com.finwise.user.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * The single place that turns the validated token into a local user.
 * User ids are never accepted from request bodies, parameters or the LLM.
 */
@Component
public class CurrentUser {

    private final UserService users;

    public CurrentUser(UserService users) {
        this.users = users;
    }

    public User get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("No authenticated JWT principal");
        }
        // The access token only carries "email" if the Okta authorization server adds the claim.
        return users.findOrCreate(jwt.getSubject(), jwt.getClaimAsString("email"));
    }

    public Long id() {
        return get().getId();
    }
}
