package com.cavienchien.auth;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    // =========================
    // TÀI KHOẢN CỐ ĐỊNH
    // =========================

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "123456";

    private static final String STAFF_USERNAME = "staff";
    private static final String STAFF_PASSWORD = "123456";


    public Role authenticate(
            String username,
            String password
    ) {

        if (username == null || password == null) {
            return null;
        }

        // ADMIN
        if (ADMIN_USERNAME.equals(username)
                && ADMIN_PASSWORD.equals(password)) {

            return Role.ADMIN;
        }

        // STAFF
        if (STAFF_USERNAME.equals(username)
                && STAFF_PASSWORD.equals(password)) {

            return Role.STAFF;
        }

        return null;
    }
}