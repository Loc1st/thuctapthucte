package com.cavienchien.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record DonHangResponse(
        Integer maDonHang,
        Integer maBan,
        String tenBan,
        Integer maPhien,
        BigDecimal tongTien,
        Integer trangThai,
        LocalDateTime ngayDat,
        List<ChiTietResponse> items
) {
    public record ChiTietResponse(
            String maSanPham,
            String tenSanPham,
            Integer soLuong,
            BigDecimal donGia,
            BigDecimal tongTien
    ) {}
}
