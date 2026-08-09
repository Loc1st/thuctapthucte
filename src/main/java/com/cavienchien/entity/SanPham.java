package com.cavienchien.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sanpham")
public class SanPham {
    @Id
    @Column(name = "masanpham", length = 50)
    private String maSanPham;

    @Column(name = "tensanpham", nullable = false, length = 150)
    private String tenSanPham;

    @Column(name = "soluong")
    private Integer soLuong;

    @Column(name = "giaban", precision = 15, scale = 2)
    private BigDecimal giaBan;

    @Column(name = "anhsanpham", length = 255)
    private String anhSanPham;

    @Column(name = "mota", columnDefinition = "TEXT")
    private String moTa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "madanhmuc")
    private DanhMuc danhMuc;

    public String getMaSanPham() { return maSanPham; }
    public void setMaSanPham(String v) { maSanPham = v; }
    public String getTenSanPham() { return tenSanPham; }
    public void setTenSanPham(String v) { tenSanPham = v; }
    public Integer getSoLuong() { return soLuong; }
    public void setSoLuong(Integer v) { soLuong = v; }
    public BigDecimal getGiaBan() { return giaBan; }
    public void setGiaBan(BigDecimal v) { giaBan = v; }
    public String getAnhSanPham() { return anhSanPham; }
    public void setAnhSanPham(String v) { anhSanPham = v; }
    public String getMoTa() { return moTa; }
    public void setMoTa(String v) { moTa = v; }
    public DanhMuc getDanhMuc() { return danhMuc; }
    public void setDanhMuc(DanhMuc v) { danhMuc = v; }
}
