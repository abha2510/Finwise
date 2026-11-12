package com.finwise.account;

import com.finwise.auth.CurrentUser;
import com.finwise.common.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    public record AccountRequest(
            @NotBlank @Size(max = 100) String name,
            @NotNull Account.Type type,
            @NotNull @Digits(integer = 12, fraction = 2) BigDecimal openingBalance) {}

    public record AccountResponse(Long id, String name, Account.Type type, BigDecimal openingBalance) {
        static AccountResponse from(Account a) {
            return new AccountResponse(a.getId(), a.getName(), a.getType(), a.getOpeningBalance());
        }
    }

    private final AccountRepository accounts;
    private final CurrentUser currentUser;

    public AccountController(AccountRepository accounts, CurrentUser currentUser) {
        this.accounts = accounts;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<AccountResponse> list() {
        return accounts.findByUserIdOrderByNameAsc(currentUser.id()).stream()
                .map(AccountResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(@Valid @RequestBody AccountRequest req) {
        Account saved = accounts.save(
                new Account(currentUser.id(), req.name().trim(), req.type(), req.openingBalance()));
        return AccountResponse.from(saved);
    }

    @PutMapping("/{id}")
    @Transactional
    public AccountResponse update(@PathVariable Long id, @Valid @RequestBody AccountRequest req) {
        Account account = accounts.findByIdAndUserId(id, currentUser.id())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        account.setName(req.name().trim());
        account.setType(req.type());
        account.setOpeningBalance(req.openingBalance());
        return AccountResponse.from(account);
    }

    /** Deleting an account also deletes its transactions (ON DELETE CASCADE). */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        Account account = accounts.findByIdAndUserId(id, currentUser.id())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        accounts.delete(account);
    }
}
