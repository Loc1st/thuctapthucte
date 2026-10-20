
package com.cavienchien.auth;

import com.cavienchien.entity.TaiKhoan;
import com.cavienchien.repository.TaiKhoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final TaiKhoanRepository taiKhoanRepository;

    public AuthService(TaiKhoanRepository taiKhoanRepository) {
        this.taiKhoanRepository = taiKhoanRepository;
    }

    @Transactional
    public Role authenticate(String username, String password) {
        if (username == null || password == null) {
            return null;
        }

        TaiKhoan taiKhoan = taiKhoanRepository
                .findByTenDangNhap(username.trim())
                .orElse(null);

        if (taiKhoan == null) {
            return null;
        }

        // Không cho đăng nhập nếu tài khoản bị khóa
        if (taiKhoan.getTrangThai() != TaiKhoan.TrangThai.ACTIVE) {
            return null;
        }

        // So sánh mật khẩu theo yêu cầu hiện tại
        if (!taiKhoan.getMatKhau().equals(password)) {
            return null;
        }

        taiKhoan.setDangNhapCuoi(LocalDateTime.now());
        taiKhoanRepository.save(taiKhoan);

        return taiKhoan.getVaiTro() == TaiKhoan.VaiTro.ADMIN
                ? Role.ADMIN
                : Role.STAFF;
    }
}
