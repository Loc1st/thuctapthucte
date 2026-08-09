package com.cavienchien.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "chitietdonhang")
public class ChiTietDonHang {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "machitiet")
    private Integer maChiTiet;

    @Column(name = "madonhang")
    private Integer maDonHang;

    @Column(name = "masanpham", length = 50)
    private String maSanPham;

    @Column(name = "soluong")
    private Integer soLuong;

    @Column(name = "dongia", precision = 15, scale = 2)
    private BigDecimal donGia;

    @Column(name = "tongtien", precision = 15, scale = 2)
    private BigDecimal tongTien;

    public Integer getMaChiTiet() { return maChiTiet; }
    public Integer getMaDonHang() { return maDonHang; }
    public String getMaSanPham() { return maSanPham; }
    public Integer getSoLuong() { return soLuong; }
    public BigDecimal getDonGia() { return donGia; }
    public BigDecimal getTongTien() { return tongTien; }

    public void setMaDonHang(Integer value) { maDonHang = value; }
    public void setMaSanPham(String value) { maSanPham = value; }
    public void setSoLuong(Integer value) { soLuong = value; }
    public void setDonGia(BigDecimal value) { donGia = value; }
    public void setTongTien(BigDecimal value) { tongTien = value; }
}
