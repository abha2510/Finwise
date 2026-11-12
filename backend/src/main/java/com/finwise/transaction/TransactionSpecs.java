package com.finwise.transaction;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

final class TransactionSpecs {

    private TransactionSpecs() {}

    /** userId is mandatory and always applied first: isolation cannot be forgotten by a caller. */
    static Specification<Transaction> filter(
            Long userId, LocalDate from, LocalDate to, Long categoryId, Long accountId, String q) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("userId"), userId));
            if (from != null) p.add(cb.greaterThanOrEqualTo(root.get("txnDate"), from));
            if (to != null) p.add(cb.lessThanOrEqualTo(root.get("txnDate"), to));
            if (categoryId != null) p.add(cb.equal(root.get("categoryId"), categoryId));
            if (accountId != null) p.add(cb.equal(root.get("accountId"), accountId));
            if (q != null && !q.isBlank()) {
                String pattern = "%" + escapeLike(q.trim().toLowerCase()) + "%";
                p.add(cb.or(
                        cb.like(cb.lower(root.get("description")), pattern, '\\'),
                        cb.like(cb.lower(root.get("merchant")), pattern, '\\'),
                        cb.like(cb.lower(root.get("notes")), pattern, '\\')));
            }
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
