package com.finwise.category;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    /** Defaults (user_id IS NULL) plus the user's own. */
    @Query("select c from Category c where c.userId is null or c.userId = :userId order by c.type, c.name")
    List<Category> findVisibleTo(@Param("userId") Long userId);

    /** A category the user may assign to a transaction: a default or their own. */
    @Query("select c from Category c where c.id = :id and (c.userId is null or c.userId = :userId)")
    Optional<Category> findVisibleById(@Param("id") Long id, @Param("userId") Long userId);

    /** Only the user's own categories can be edited or deleted; defaults are read-only. */
    Optional<Category> findByIdAndUserId(Long id, Long userId);
}
