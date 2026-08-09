package com.cavienchien.repository;

import com.cavienchien.entity.PhienBan;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PhienBanRepository extends JpaRepository<PhienBan, Integer> {

    Optional<PhienBan> findByBan_MaBanAndTrangThai(
            Integer maBan,
            Integer trangThai
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PhienBan p WHERE p.maPhien = :maPhien")
    Optional<PhienBan> findByIdForUpdate(
            @Param("maPhien") Integer maPhien
    );
}