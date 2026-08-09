package com.cavienchien.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "donhang")
public class DonHang {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "madonhang")
    private Integer maDonHang;

    @Column(name = "manguoidung")
    private Integer maNguoiDung;

    @Column(name = "maphien")
    private Integer maPhien;

    @Column(name = "tongtien", precision = 15, scale = 2)
    private BigDecimal tongTien;

    @Column(name = "diachigiaohang", length = 200)
    private String diaChiGiaoHang;

    @Column(name = "phuongthucthanhtoan", length = 100)
    private String phuongThucThanhToan;

    @Column(name = "ngaydat")
    private LocalDateTime ngayDat;

    @Column(name = "trangthai")
    private Integer trangThai;

    // Phiên ăn hiện tại của khách
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "maphien",
            insertable = false,
            updatable = false
    )
    private PhienBan phienBan;

    @PrePersist
    void prePersist() {
        if (ngayDat == null) {
            ngayDat = LocalDateTime.now();
        }

        if (trangThai == null) {
            trangThai = 0;
        }
    }

    // =========================
    // GETTER
    // =========================

    public Integer getMaDonHang() {
        return maDonHang;
    }

    public Integer getMaNguoiDung() {
        return maNguoiDung;
    }

    public Integer getMaPhien() {
        return maPhien;
    }

    public BigDecimal getTongTien() {
        return tongTien;
    }

    public String getDiaChiGiaoHang() {
        return diaChiGiaoHang;
    }

    public String getPhuongThucThanhToan() {
        return phuongThucThanhToan;
    }

    public LocalDateTime getNgayDat() {
        return ngayDat;
    }

    public Integer getTrangThai() {
        return trangThai;
    }

    public PhienBan getPhienBan() {
        return phienBan;
    }

    // =========================
    // SETTER
    // =========================

    public void setMaNguoiDung(Integer value) {
        maNguoiDung = value;
    }

    public void setMaPhien(Integer value) {
        maPhien = value;
    }

    public void setTongTien(BigDecimal value) {
        tongTien = value;
    }

    public void setDiaChiGiaoHang(String value) {
        diaChiGiaoHang = value;
    }

    public void setPhuongThucThanhToan(String value) {
        phuongThucThanhToan = value;
    }

    public void setNgayDat(LocalDateTime value) {
        ngayDat = value;
    }

    public void setTrangThai(Integer value) {
        trangThai = value;
    }

    public void setPhienBan(PhienBan value) {
        phienBan = value;
    }
}