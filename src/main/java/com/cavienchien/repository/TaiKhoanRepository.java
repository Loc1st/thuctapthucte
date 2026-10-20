
package com.cavienchien.repository;

import com.cavienchien.entity.TaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TaiKhoanRepository extends JpaRepository<TaiKhoan, Integer> {

    Optional<TaiKhoan> findByTenDangNhap(String tenDangNhap);

    boolean existsByTenDangNhap(String tenDangNhap);

    boolean existsByEmail(String email);

    List<TaiKhoan> findByHoTenContainingIgnoreCaseOrTenDangNhapContainingIgnoreCase(
            String hoTen,
            String tenDangNhap
    );
}
