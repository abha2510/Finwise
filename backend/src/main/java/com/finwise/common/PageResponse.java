package com.finwise.common;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Lists return { content, page, size, totalElements }. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements) {

    public static <E, T> PageResponse<T> from(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements());
    }
}
