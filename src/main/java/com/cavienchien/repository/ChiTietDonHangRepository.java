package com.cavienchien.repository;

import com.cavienchien.entity.ChiTietDonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChiTietDonHangRepository extends JpaRepository<ChiTietDonHang, Integer> {
    List<ChiTietDonHang> findByMaDonHang(Integer maDonHang);
}
