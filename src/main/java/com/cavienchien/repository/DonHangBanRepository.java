package com.cavienchien.repository;

import com.cavienchien.entity.DonHangBan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DonHangBanRepository extends JpaRepository<DonHangBan, Integer> {
    Optional<DonHangBan> findByMaDonHang(Integer maDonHang);
    List<DonHangBan> findByBan_MaBan(Integer maBan);
}
