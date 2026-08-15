package com.cavienchien.auth;

public record LoginResponse(
        boolean success,
        String username,
        String role,
        String message
) {
}