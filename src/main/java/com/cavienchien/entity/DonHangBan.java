package com.cavienchien.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "donhangban")
public class DonHangBan {
    @Id
    @Column(name = "madonhang")
    private Integer maDonHang;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "madonhang")
    private DonHang donHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maban", nullable = false)
    private Ban ban;

    public Integer getMaDonHang() { return maDonHang; }
    public DonHang getDonHang() { return donHang; }
    public Ban getBan() { return ban; }
    public void setDonHang(DonHang value) { donHang = value; }
    public void setBan(Ban value) { ban = value; }
}
