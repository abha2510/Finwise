package com.finwise.user;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    /**
     * Maps an Okta identity (sub) to exactly one local user, creating it on first login.
     * Deliberately not @Transactional: if two first requests race, the unique constraint on
     * okta_sub rejects one insert and we simply re-read the winner's row.
     */
    public User findOrCreate(String oktaSub, String email) {
        return users.findByOktaSub(oktaSub).orElseGet(() -> {
            try {
                return users.saveAndFlush(new User(oktaSub, email));
            } catch (DataIntegrityViolationException race) {
                return users.findByOktaSub(oktaSub).orElseThrow(() -> race);
            }
        });
    }

    public User updateProfile(Long userId, String currency, int monthStartDay) {
        User user = users.findById(userId).orElseThrow();
        user.setCurrency(currency);
        user.setMonthStartDay(monthStartDay);
        return users.save(user);
    }
}
