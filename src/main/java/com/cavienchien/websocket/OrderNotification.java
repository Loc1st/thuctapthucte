package com.cavienchien.websocket;

import java.math.BigDecimal;

public class OrderNotification {

    private Integer maDonHang;
    private Integer maBan;
    private String tenBan;
    private BigDecimal tongTien;

    public OrderNotification() {
    }

    public OrderNotification(
            Integer maDonHang,
            Integer maBan,
            String tenBan,
            BigDecimal tongTien
    ) {
        this.maDonHang = maDonHang;
        this.maBan = maBan;
        this.tenBan = tenBan;
        this.tongTien = tongTien;
    }

    public Integer getMaDonHang() {
        return maDonHang;
    }

    public Integer getMaBan() {
        return maBan;
    }

    public String getTenBan() {
        return tenBan;
    }

    public BigDecimal getTongTien() {
        return tongTien;
    }
}