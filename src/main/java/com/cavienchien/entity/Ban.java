package com.cavienchien.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ban")
public class Ban {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maban")
    private Integer maBan;

    @Column(name = "tenban", nullable = false, length = 50)
    private String tenBan;

    @Column(name = "trangthai", nullable = false)
    private Integer trangThai = 0;

    @Column(name = "maqr", unique = true, length = 255)
    private String maQr;

    public Integer getMaBan() { return maBan; }
    public void setMaBan(Integer maBan) { this.maBan = maBan; }

    public String getTenBan() { return tenBan; }
    public void setTenBan(String tenBan) { this.tenBan = tenBan; }

    public Integer getTrangThai() { return trangThai; }
    public void setTrangThai(Integer trangThai) { this.trangThai = trangThai; }

    public String getMaQr() { return maQr; }
    public void setMaQr(String maQr) { this.maQr = maQr; }
}
