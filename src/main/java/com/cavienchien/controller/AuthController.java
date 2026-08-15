package com.cavienchien.controller;

import com.cavienchien.auth.AuthService;
import com.cavienchien.auth.LoginRequest;
import com.cavienchien.auth.LoginResponse;
import com.cavienchien.auth.Role;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public static final String SESSION_USERNAME = "AUTH_USERNAME";
    public static final String SESSION_ROLE = "AUTH_ROLE";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // =========================
    // ĐĂNG NHẬP
    // =========================

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request,
            HttpSession session
    ) {

        if (request == null) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            new LoginResponse(
                                    false,
                                    null,
                                    null,
                                    "Dữ liệu đăng nhập không hợp lệ."
                            )
                    );
        }

        Role role =
                authService.authenticate(
                        request.getUsername(),
                        request.getPassword()
                );

        if (role == null) {

            return ResponseEntity
                    .status(401)
                    .body(
                            new LoginResponse(
                                    false,
                                    null,
                                    null,
                                    "Sai tên đăng nhập hoặc mật khẩu."
                            )
                    );
        }

        session.setAttribute(
                SESSION_USERNAME,
                request.getUsername()
        );

        session.setAttribute(
                SESSION_ROLE,
                role.name()
        );

        return ResponseEntity.ok(
                new LoginResponse(
                        true,
                        request.getUsername(),
                        role.name(),
                        "Đăng nhập thành công."
                )
        );
    }

    // =========================
    // KIỂM TRA ĐĂNG NHẬP
    // =========================

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me(
            HttpSession session
    ) {

        String username =
                (String) session.getAttribute(
                        SESSION_USERNAME
                );

        String role =
                (String) session.getAttribute(
                        SESSION_ROLE
                );

        if (username == null || role == null) {

            return ResponseEntity
                    .status(401)
                    .body(
                            new LoginResponse(
                                    false,
                                    null,
                                    null,
                                    "Chưa đăng nhập."
                            )
                    );
        }

        return ResponseEntity.ok(
                new LoginResponse(
                        true,
                        username,
                        role,
                        "Đang đăng nhập."
                )
        );
    }

    // =========================
    // ĐĂNG XUẤT
    // =========================

    @PostMapping("/logout")
    public ResponseEntity<LoginResponse> logout(
            HttpSession session
    ) {

        session.invalidate();

        return ResponseEntity.ok(
                new LoginResponse(
                        true,
                        null,
                        null,
                        "Đã đăng xuất."
                )
        );
    }
}