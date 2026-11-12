package com.finwise.transaction;

import com.finwise.auth.CurrentUser;
import com.finwise.common.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    public record TransactionRequest(
            @NotNull Long accountId,
            Long categoryId,
            @NotNull @DecimalMin(value = "0.01", message = "must be greater than zero")
            @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @NotNull Transaction.Type type,
            @NotNull LocalDate txnDate,
            @Size(max = 500) String description,
            @Size(max = 200) String merchant,
            @Size(max = 1000) String notes,
            @Size(max = 20) List<@Size(max = 40) String> tags) {}

    public record CategoryPatch(@NotNull Long categoryId) {}

    public record TransactionResponse(
            Long id, Long accountId, Long categoryId, BigDecimal amount, Transaction.Type type,
            LocalDate txnDate, String description, String merchant, String notes, List<String> tags,
            boolean needsReview) {

        static TransactionResponse from(Transaction t) {
            boolean needsReview = t.getCategoryId() == null && t.getType() != Transaction.Type.TRANSFER;
            return new TransactionResponse(
                    t.getId(), t.getAccountId(), t.getCategoryId(), t.getAmount(), t.getType(),
                    t.getTxnDate(), t.getDescription(), t.getMerchant(), t.getNotes(),
                    List.copyOf(t.getTags()), needsReview);
        }
    }

    private final TransactionService service;
    private final CurrentUser currentUser;

    public TransactionController(TransactionService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public PageResponse<TransactionResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) Long account,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return PageResponse.from(
                service.list(currentUser.id(), from, to, category, account, q, page, size),
                TransactionResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(@Valid @RequestBody TransactionRequest req) {
        return TransactionResponse.from(service.create(currentUser.id(), req));
    }

    @PutMapping("/{id}")
    public TransactionResponse update(@PathVariable Long id, @Valid @RequestBody TransactionRequest req) {
        return TransactionResponse.from(service.update(currentUser.id(), id, req));
    }

    @PatchMapping("/{id}/category")
    public TransactionResponse setCategory(@PathVariable Long id, @Valid @RequestBody CategoryPatch patch) {
        return TransactionResponse.from(service.setCategory(currentUser.id(), id, patch.categoryId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(currentUser.id(), id);
    }
}
