package com.finwise.transaction;

import com.finwise.account.AccountRepository;
import com.finwise.category.CategoryRepository;
import com.finwise.common.NotFoundException;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    static final int MAX_PAGE_SIZE = 100;

    private final TransactionRepository transactions;
    private final AccountRepository accounts;
    private final CategoryRepository categories;

    public TransactionService(
            TransactionRepository transactions, AccountRepository accounts, CategoryRepository categories) {
        this.transactions = transactions;
        this.accounts = accounts;
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public Page<Transaction> list(
            Long userId, LocalDate from, LocalDate to, Long categoryId, Long accountId, String q,
            int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int safePage = Math.max(page, 0);
        PageRequest pageable = PageRequest.of(
                safePage, safeSize, Sort.by(Sort.Order.desc("txnDate"), Sort.Order.desc("id")));
        return transactions.findAll(TransactionSpecs.filter(userId, from, to, categoryId, accountId, q), pageable);
    }

    @Transactional
    public Transaction create(Long userId, TransactionController.TransactionRequest req) {
        Transaction txn = new Transaction(userId);
        apply(userId, txn, req);
        return transactions.save(txn);
    }

    @Transactional
    public Transaction update(Long userId, Long id, TransactionController.TransactionRequest req) {
        Transaction txn = find(userId, id);
        apply(userId, txn, req);
        return txn;
    }

    @Transactional
    public void delete(Long userId, Long id) {
        transactions.delete(find(userId, id));
    }

    /** Week 3 extends this to also save a keyword rule from the correction. */
    @Transactional
    public Transaction setCategory(Long userId, Long id, Long categoryId) {
        Transaction txn = find(userId, id);
        requireVisibleCategory(userId, categoryId);
        txn.setCategoryId(categoryId);
        return txn;
    }

    private Transaction find(Long userId, Long id) {
        return transactions.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Transaction not found"));
    }

    private void apply(Long userId, Transaction txn, TransactionController.TransactionRequest req) {
        // A transaction may only reference the caller's own account and visible categories.
        if (!accounts.existsByIdAndUserId(req.accountId(), userId)) {
            throw new NotFoundException("Account not found");
        }
        if (req.categoryId() != null) {
            requireVisibleCategory(userId, req.categoryId());
        }
        txn.setAccountId(req.accountId());
        txn.setCategoryId(req.categoryId());
        txn.setAmount(req.amount());
        txn.setType(req.type());
        txn.setTxnDate(req.txnDate());
        txn.setDescription(blankToNull(req.description()));
        txn.setMerchant(blankToNull(req.merchant()));
        txn.setNotes(blankToNull(req.notes()));
        txn.setTags(normalizeTags(req.tags()));
    }

    private void requireVisibleCategory(Long userId, Long categoryId) {
        categories.findVisibleById(categoryId, userId)
                .orElseThrow(() -> new NotFoundException("Category not found"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static List<String> normalizeTags(List<String> tags) {
        if (tags == null) return List.of();
        return tags.stream().filter(t -> t != null && !t.isBlank()).map(String::trim).distinct().limit(20).toList();
    }
}
