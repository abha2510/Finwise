package com.finwise.common;

import java.util.List;

/** The one error shape used by every endpoint: { code, message, details }. */
public record ApiError(String code, String message, List<String> details) {

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, List.of());
    }
}
