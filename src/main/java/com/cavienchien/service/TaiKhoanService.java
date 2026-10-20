
package com.cavienchien.service;

import com.cavienchien.entity.TaiKhoan;
import com.cavienchien.repository.TaiKhoanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TaiKhoanService {

    private final TaiKhoanRepository taiKhoanRepository;

    public TaiKhoanService(TaiKhoanRepository taiKhoanRepository) {
        this.taiKhoanRepository = taiKhoanRepository;
    }

    public List<TaiKhoan> layDanhSach(String tuKhoa) {
        if (tuKhoa == null || tuKhoa.isBlank()) {
            return taiKhoanRepository.findAll();
        }

        String keyword = tuKhoa.trim();

        return taiKhoanRepository
                .findByHoTenContainingIgnoreCaseOrTenDangNhapContainingIgnoreCase(
                        keyword, keyword
                );
    }

    public TaiKhoan layTheoMa(Integer maTaiKhoan) {
        return taiKhoanRepository.findById(maTaiKhoan)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy tài khoản."));
    }

    @Transactional
    public TaiKhoan them(TaiKhoan taiKhoan) {
        if (taiKhoan.getTenDangNhap() == null
                || taiKhoan.getTenDangNhap().isBlank()) {
            throw new RuntimeException("Tên đăng nhập không được để trống.");
        }

        if (taiKhoan.getMatKhau() == null
                || taiKhoan.getMatKhau().isBlank()) {
            throw new RuntimeException("Mật khẩu không được để trống.");
        }

        if (taiKhoan.getHoTen() == null
                || taiKhoan.getHoTen().isBlank()) {
            throw new RuntimeException("Họ tên không được để trống.");
        }

        String tenDangNhap = taiKhoan.getTenDangNhap().trim();

        if (taiKhoanRepository.existsByTenDangNhap(tenDangNhap)) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại.");
        }

        if (taiKhoan.getEmail() != null
                && !taiKhoan.getEmail().isBlank()
                && taiKhoanRepository.existsByEmail(taiKhoan.getEmail().trim())) {
            throw new RuntimeException("Email đã tồn tại.");
        }

        taiKhoan.setMaTaiKhoan(null);
        taiKhoan.setTenDangNhap(tenDangNhap);
        taiKhoan.setHoTen(taiKhoan.getHoTen().trim());

        if (taiKhoan.getEmail() != null
                && taiKhoan.getEmail().isBlank()) {
            taiKhoan.setEmail(null);
        } else if (taiKhoan.getEmail() != null) {
            taiKhoan.setEmail(taiKhoan.getEmail().trim());
        }

        if (taiKhoan.getVaiTro() == null) {
            taiKhoan.setVaiTro(TaiKhoan.VaiTro.STAFF);
        }

        if (taiKhoan.getTrangThai() == null) {
            taiKhoan.setTrangThai(TaiKhoan.TrangThai.ACTIVE);
        }

        return taiKhoanRepository.save(taiKhoan);
    }

    @Transactional
    public TaiKhoan capNhat(Integer maTaiKhoan, TaiKhoan thongTinMoi) {
        TaiKhoan taiKhoan = layTheoMa(maTaiKhoan);

        if (thongTinMoi.getHoTen() == null
                || thongTinMoi.getHoTen().isBlank()) {
            throw new RuntimeException("Họ tên không được để trống.");
        }

        if (thongTinMoi.getTenDangNhap() == null
                || thongTinMoi.getTenDangNhap().isBlank()) {
            throw new RuntimeException("Tên đăng nhập không được để trống.");
        }

        String tenDangNhap = thongTinMoi.getTenDangNhap().trim();

        taiKhoanRepository.findByTenDangNhap(tenDangNhap)
                .filter(tk -> !tk.getMaTaiKhoan().equals(maTaiKhoan))
                .ifPresent(tk -> {
                    throw new RuntimeException("Tên đăng nhập đã tồn tại.");
                });

        if (thongTinMoi.getEmail() != null
                && !thongTinMoi.getEmail().isBlank()) {
            String email = thongTinMoi.getEmail().trim();

            taiKhoanRepository.findAll().stream()
                    .filter(tk -> !tk.getMaTaiKhoan().equals(maTaiKhoan))
                    .filter(tk -> email.equalsIgnoreCase(tk.getEmail()))
                    .findFirst()
                    .ifPresent(tk -> {
                        throw new RuntimeException("Email đã tồn tại.");
                    });

            taiKhoan.setEmail(email);
        } else {
            taiKhoan.setEmail(null);
        }

        taiKhoan.setTenDangNhap(tenDangNhap);
        taiKhoan.setHoTen(thongTinMoi.getHoTen().trim());

        if (thongTinMoi.getMatKhau() != null
                && !thongTinMoi.getMatKhau().isBlank()) {
            taiKhoan.setMatKhau(thongTinMoi.getMatKhau());
        }

        if (thongTinMoi.getVaiTro() != null) {
            taiKhoan.setVaiTro(thongTinMoi.getVaiTro());
        }

        if (thongTinMoi.getTrangThai() != null) {
            taiKhoan.setTrangThai(thongTinMoi.getTrangThai());
        }

        return taiKhoanRepository.save(taiKhoan);
    }

    @Transactional
    public void xoa(Integer maTaiKhoan, String tenDangNhapDangThaoTac) {
        TaiKhoan taiKhoan = layTheoMa(maTaiKhoan);

        if (taiKhoan.getTenDangNhap().equals(tenDangNhapDangThaoTac)) {
            throw new RuntimeException("Không thể xóa tài khoản đang đăng nhập.");
        }

        if (taiKhoan.getVaiTro() == TaiKhoan.VaiTro.ADMIN) {
            long soAdmin = taiKhoanRepository.findAll().stream()
                    .filter(tk -> tk.getVaiTro() == TaiKhoan.VaiTro.ADMIN)
                    .count();

            if (soAdmin <= 1) {
                throw new RuntimeException(
                        "Không thể xóa tài khoản ADMIN cuối cùng."
                );
            }
        }

        taiKhoanRepository.delete(taiKhoan);
    }

    @Transactional
    public TaiKhoan doiTrangThai(Integer maTaiKhoan, String tenDangNhapDangThaoTac) {
        TaiKhoan taiKhoan = layTheoMa(maTaiKhoan);

        if (taiKhoan.getTenDangNhap().equals(tenDangNhapDangThaoTac)) {
            throw new RuntimeException("Không thể khóa tài khoản đang đăng nhập.");
        }

        if (taiKhoan.getVaiTro() == TaiKhoan.VaiTro.ADMIN
                && taiKhoan.getTrangThai() == TaiKhoan.TrangThai.ACTIVE) {
            long soAdminHoatDong = taiKhoanRepository.findAll().stream()
                    .filter(tk -> tk.getVaiTro() == TaiKhoan.VaiTro.ADMIN)
                    .filter(tk -> tk.getTrangThai() == TaiKhoan.TrangThai.ACTIVE)
                    .count();

            if (soAdminHoatDong <= 1) {
                throw new RuntimeException(
                        "Không thể khóa ADMIN đang hoạt động cuối cùng."
                );
            }
        }

        taiKhoan.setTrangThai(
                taiKhoan.getTrangThai() == TaiKhoan.TrangThai.ACTIVE
                        ? TaiKhoan.TrangThai.LOCKED
                        : TaiKhoan.TrangThai.ACTIVE
        );

        return taiKhoanRepository.save(taiKhoan);
    }
}
