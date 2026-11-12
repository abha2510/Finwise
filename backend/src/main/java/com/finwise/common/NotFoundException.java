package com.finwise.common;

/** Also used when a row exists but belongs to another user, so existence is never leaked. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
