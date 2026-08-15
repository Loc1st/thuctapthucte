package com.cavienchien.config;

import com.cavienchien.auth.Role;
import com.cavienchien.controller.AuthController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) throws Exception {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        // ==========================================
        // AUTH PUBLIC
        // ==========================================

        if (uri.startsWith("/api/auth/")) {
            return true;
        }

        // ==========================================
        // API SẢN PHẨM
        // ==========================================

        if (uri.startsWith("/api/san-pham")) {

            // Khách được xem menu
            if (HttpMethod.GET.matches(method)) {
                return true;
            }

            // Thêm / sửa / xóa món -> ADMIN
            return requireRole(
                    request,
                    response,
                    Role.ADMIN
            );
        }

        // ==========================================
        // API ĐẶT MÓN
        // ==========================================

        if (uri.equals("/api/don-hang")
                && HttpMethod.POST.matches(method)) {

            // Khách được đặt món
            return true;
        }

        // ==========================================
        // API ĐƠN HÀNG
        // STAFF + ADMIN
        // ==========================================

        if (uri.startsWith("/api/don-hang")) {

            return requireAnyRole(
                    request,
                    response,
                    Role.ADMIN,
                    Role.STAFF
            );
        }

        // ==========================================
        // API BÀN
        // ==========================================

        if (uri.startsWith("/api/ban")) {

            // Xem bàn
            if (HttpMethod.GET.matches(method)) {
                return true;
            }

            // Thêm / sửa / xóa bàn -> ADMIN
            return requireRole(
                    request,
                    response,
                    Role.ADMIN
            );
        }

        // ==========================================
        // TRANG ADMIN
        // ==========================================

        if (uri.startsWith("/admin/")) {

            return requireRole(
                    request,
                    response,
                    Role.ADMIN
            );
        }

        // ==========================================
        // TRANG STAFF
        // ==========================================

        if (uri.startsWith("/staff/")) {

            return requireAnyRole(
                    request,
                    response,
                    Role.ADMIN,
                    Role.STAFF
            );
        }

        return true;
    }


    // =====================================================
    // CHỈ 1 ROLE
    // =====================================================

    private boolean requireRole(
            HttpServletRequest request,
            HttpServletResponse response,
            Role requiredRole
    ) throws Exception {

        String role =
                (String) request.getSession()
                        .getAttribute(
                                AuthController.SESSION_ROLE
                        );

        if (role == null) {

            unauthorized(response);
            return false;
        }

        if (!requiredRole.name().equals(role)) {

            forbidden(response);
            return false;
        }

        return true;
    }


    // =====================================================
    // NHIỀU ROLE
    // =====================================================

    private boolean requireAnyRole(
            HttpServletRequest request,
            HttpServletResponse response,
            Role... allowedRoles
    ) throws Exception {

        String role =
                (String) request.getSession()
                        .getAttribute(
                                AuthController.SESSION_ROLE
                        );

        if (role == null) {

            unauthorized(response);
            return false;
        }

        for (Role allowedRole : allowedRoles) {

            if (allowedRole.name().equals(role)) {
                return true;
            }
        }

        forbidden(response);
        return false;
    }


    private void unauthorized(
            HttpServletResponse response
    ) throws Exception {

        response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
        );

        response.setContentType(
                "application/json;charset=UTF-8"
        );

        response.getWriter().write(
                "{\"message\":\"Chưa đăng nhập.\"}"
        );
    }


    private void forbidden(
            HttpServletResponse response
    ) throws Exception {

        response.setStatus(
                HttpServletResponse.SC_FORBIDDEN
        );

        response.setContentType(
                "application/json;charset=UTF-8"
        );

        response.getWriter().write(
                "{\"message\":\"Bạn không có quyền thực hiện thao tác này.\"}"
        );
    }
}