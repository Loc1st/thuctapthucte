
package com.cavienchien.controller;

import com.cavienchien.controller.AuthController;
import com.cavienchien.entity.TaiKhoan;
import com.cavienchien.service.TaiKhoanService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tai-khoan")
public class TaiKhoanController {

    private final TaiKhoanService taiKhoanService;

    public TaiKhoanController(TaiKhoanService taiKhoanService) {
        this.taiKhoanService = taiKhoanService;
    }

    // DTO trả về frontend, không gửi mật khẩu trong danh sách
    public record TaiKhoanResponse(
            Integer maTaiKhoan,
            String tenDangNhap,
            String hoTen,
            String email,
            String vaiTro,
            String trangThai,
            java.time.LocalDateTime dangNhapCuoi,
            java.time.LocalDateTime ngayTao,
            java.time.LocalDateTime ngayCapNhat
    ) {
        public static TaiKhoanResponse from(TaiKhoan tk) {
            return new TaiKhoanResponse(
                    tk.getMaTaiKhoan(),
                    tk.getTenDangNhap(),
                    tk.getHoTen(),
                    tk.getEmail(),
                    tk.getVaiTro().name(),
                    tk.getTrangThai().name(),
                    tk.getDangNhapCuoi(),
                    tk.getNgayTao(),
                    tk.getNgayCapNhat()
            );
        }
    }

    // Chỉ ADMIN được quản lý tài khoản
    private ResponseEntity<?> kiemTraAdmin(HttpSession session) {
        String role = (String) session.getAttribute(
                AuthController.SESSION_ROLE
        );

        if (role == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập."));
        }

        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn không có quyền thực hiện thao tác này."));
        }

        return null;
    }

    // GET /api/tai-khoan?tuKhoa=...
    @GetMapping
    public ResponseEntity<?> layDanhSach(
            @RequestParam(required = false) String tuKhoa,
            HttpSession session
    ) {
        ResponseEntity<?> loi = kiemTraAdmin(session);
        if (loi != null) return loi;

        List<TaiKhoanResponse> danhSach = taiKhoanService
                .layDanhSach(tuKhoa)
                .stream()
                .map(TaiKhoanResponse::from)
                .toList();

        return ResponseEntity.ok(danhSach);
    }

    // GET /api/tai-khoan/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> layChiTiet(
            @PathVariable Integer id,
            HttpSession session
    ) {
        ResponseEntity<?> loi = kiemTraAdmin(session);
        if (loi != null) return loi;

        try {
            return ResponseEntity.ok(
                    TaiKhoanResponse.from(taiKhoanService.layTheoMa(id))
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // POST /api/tai-khoan
    @PostMapping
    public ResponseEntity<?> them(
            @RequestBody TaiKhoan taiKhoan,
            HttpSession session
    ) {
        ResponseEntity<?> loi = kiemTraAdmin(session);
        if (loi != null) return loi;

        try {
            TaiKhoan ketQua = taiKhoanService.them(taiKhoan);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(TaiKhoanResponse.from(ketQua));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // PUT /api/tai-khoan/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> capNhat(
            @PathVariable Integer id,
            @RequestBody TaiKhoan thongTinMoi,
            HttpSession session
    ) {
        ResponseEntity<?> loi = kiemTraAdmin(session);
        if (loi != null) return loi;

        try {
            TaiKhoan ketQua = taiKhoanService.capNhat(id, thongTinMoi);
            return ResponseEntity.ok(TaiKhoanResponse.from(ketQua));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // DELETE /api/tai-khoan/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> xoa(
            @PathVariable Integer id,
            HttpSession session
    ) {
        ResponseEntity<?> loi = kiemTraAdmin(session);
        if (loi != null) return loi;

        String username = (String) session.getAttribute(
                AuthController.SESSION_USERNAME
        );

        try {
            taiKhoanService.xoa(id, username);
            return ResponseEntity.ok(
                    Map.of("message", "Xóa tài khoản thành công.")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // PATCH /api/tai-khoan/{id}/trang-thai
    @PatchMapping("/{id}/trang-thai")
    public ResponseEntity<?> doiTrangThai(
            @PathVariable Integer id,
            HttpSession session
    ) {
        ResponseEntity<?> loi = kiemTraAdmin(session);
        if (loi != null) return loi;

        String username = (String) session.getAttribute(
                AuthController.SESSION_USERNAME
        );

        try {
            TaiKhoan ketQua =
                    taiKhoanService.doiTrangThai(id, username);

            return ResponseEntity.ok(TaiKhoanResponse.from(ketQua));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
