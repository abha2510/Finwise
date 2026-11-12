package com.finwise.user;

import com.finwise.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    public record ProfileResponse(Long id, String email, String currency, int monthStartDay) {
        static ProfileResponse from(User u) {
            return new ProfileResponse(u.getId(), u.getEmail(), u.getCurrency(), u.getMonthStartDay());
        }
    }

    public record ProfileRequest(
            @NotBlank @Pattern(regexp = "^[A-Z]{3}$", message = "must be a 3-letter currency code") String currency,
            @Min(1) @Max(28) int monthStartDay) {}

    private final CurrentUser currentUser;
    private final UserService userService;

    public MeController(CurrentUser currentUser, UserService userService) {
        this.currentUser = currentUser;
        this.userService = userService;
    }

    /** The first call after sign-in creates the local profile. */
    @GetMapping
    public ProfileResponse get() {
        return ProfileResponse.from(currentUser.get());
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody ProfileRequest request) {
        User updated = userService.updateProfile(currentUser.id(), request.currency(), request.monthStartDay());
        return ProfileResponse.from(updated);
    }
}
