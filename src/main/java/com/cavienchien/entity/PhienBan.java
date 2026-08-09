package com.cavienchien.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "phienban")
public class PhienBan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maphien")
    private Integer maPhien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maban", nullable = false)
    private Ban ban;

    @Column(name = "thoigianmo", nullable = false)
    private LocalDateTime thoiGianMo;

    @Column(name = "thoigiandong")
    private LocalDateTime thoiGianDong;

    /**
     * 1 = đang mở
     * 0 = đã đóng
     */
    @Column(name = "trangthai", nullable = false)
    private Integer trangThai;

    @PrePersist
    void prePersist() {
        if (thoiGianMo == null) {
            thoiGianMo = LocalDateTime.now();
        }

        if (trangThai == null) {
            trangThai = 1;
        }
    }

    public Integer getMaPhien() {
        return maPhien;
    }

    public Ban getBan() {
        return ban;
    }

    public LocalDateTime getThoiGianMo() {
        return thoiGianMo;
    }

    public LocalDateTime getThoiGianDong() {
        return thoiGianDong;
    }

    public Integer getTrangThai() {
        return trangThai;
    }

    public void setBan(Ban ban) {
        this.ban = ban;
    }

    public void setThoiGianMo(LocalDateTime thoiGianMo) {
        this.thoiGianMo = thoiGianMo;
    }

    public void setThoiGianDong(LocalDateTime thoiGianDong) {
        this.thoiGianDong = thoiGianDong;
    }

    public void setTrangThai(Integer trangThai) {
        this.trangThai = trangThai;
    }
}