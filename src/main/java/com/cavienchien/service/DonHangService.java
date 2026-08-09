package com.cavienchien.service;

import com.cavienchien.websocket.OrderNotification;
import com.cavienchien.websocket.OrderWebSocketService;
import com.cavienchien.dto.DatMonRequest;
import com.cavienchien.dto.MonDatRequest;
import com.cavienchien.dto.DonHangResponse;
import com.cavienchien.entity.*;
import com.cavienchien.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class DonHangService {

    private final DonHangRepository donHangRepository;
    private final ChiTietDonHangRepository chiTietRepository;
    private final DonHangBanRepository donHangBanRepository;
    private final BanRepository banRepository;
    private final SanPhamRepository sanPhamRepository;
    private final PhienBanRepository phienBanRepository;
    private final OrderWebSocketService orderWebSocketService;
    private final SimpMessagingTemplate messagingTemplate;

    public DonHangService(
            DonHangRepository donHangRepository,
            ChiTietDonHangRepository chiTietRepository,
            DonHangBanRepository donHangBanRepository,
            BanRepository banRepository,
            SanPhamRepository sanPhamRepository,
            PhienBanRepository phienBanRepository,
            OrderWebSocketService orderWebSocketService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.donHangRepository = donHangRepository;
        this.chiTietRepository = chiTietRepository;
        this.donHangBanRepository = donHangBanRepository;
        this.banRepository = banRepository;
        this.sanPhamRepository = sanPhamRepository;
        this.phienBanRepository = phienBanRepository;
        this.orderWebSocketService = orderWebSocketService;
        this.messagingTemplate = messagingTemplate;
    }

    // =========================
    // ĐẶT MÓN
    // =========================

    @Transactional
    public DonHangResponse datMon(DatMonRequest request) {

        if (request == null
                || request.getMaBan() == null
                || request.getItems() == null
                || request.getItems().isEmpty()) {

            throw new IllegalArgumentException(
                    "Bàn và danh sách món không được để trống."
            );
        }

        // =========================
        // TÌM BÀN
        // =========================

        Ban ban = banRepository.findById(request.getMaBan())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy bàn."
                        )
                );

        // =========================
        // TÌM HOẶC TẠO PHIÊN
        // =========================

        /*
         * Quy tắc:
         *
         * 1 = phiên đang mở
         * 0 = phiên đã đóng
         *
         * Nếu bàn đã có phiên mở:
         *      dùng lại phiên đó.
         *
         * Nếu chưa có:
         *      tạo phiên mới.
         */

        PhienBan phienBan =
                phienBanRepository
                        .findByBan_MaBanAndTrangThai(
                                ban.getMaBan(),
                                1
                        )
                        .orElseGet(() -> {

                            PhienBan phienMoi = new PhienBan();

                            phienMoi.setBan(ban);
                            phienMoi.setThoiGianMo(
                                    LocalDateTime.now()
                            );
                            phienMoi.setThoiGianDong(null);
                            phienMoi.setTrangThai(1);

                            return phienBanRepository.save(phienMoi);
                        });

        // =========================
        // TẠO ĐƠN
        // =========================

        DonHang donHang = new DonHang();

        donHang.setMaPhien(
                phienBan.getMaPhien()
        );

        donHang.setTongTien(
                BigDecimal.ZERO
        );

        donHang.setPhuongThucThanhToan(
                "TAI_QUAY"
        );

        donHang.setTrangThai(0);

        donHang = donHangRepository.save(donHang);

        // =========================
        // GẮN ĐƠN VỚI BÀN
        // =========================

        DonHangBan donHangBan = new DonHangBan();

        donHangBan.setDonHang(donHang);
        donHangBan.setBan(ban);

        donHangBanRepository.save(donHangBan);

        // =========================
        // CHI TIẾT ĐƠN
        // =========================

        BigDecimal tongTien = BigDecimal.ZERO;

        List<DonHangResponse.ChiTietResponse> responseItems =
                new ArrayList<>();

        for (MonDatRequest item : request.getItems()) {

            if (item.getMaSanPham() == null
                    || item.getSoLuong() == null
                    || item.getSoLuong() <= 0) {

                throw new IllegalArgumentException(
                        "Sản phẩm hoặc số lượng không hợp lệ."
                );
            }

            SanPham sanPham =
                    sanPhamRepository.findById(
                            item.getMaSanPham()
                    ).orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Không tìm thấy sản phẩm: "
                                            + item.getMaSanPham()
                            )
                    );

            BigDecimal donGia =
                    sanPham.getGiaBan();

            BigDecimal thanhTien =
                    donGia.multiply(
                            BigDecimal.valueOf(
                                    item.getSoLuong()
                            )
                    );

            tongTien =
                    tongTien.add(thanhTien);

            ChiTietDonHang chiTiet =
                    new ChiTietDonHang();

            chiTiet.setMaDonHang(
                    donHang.getMaDonHang()
            );

            chiTiet.setMaSanPham(
                    sanPham.getMaSanPham()
            );

            chiTiet.setSoLuong(
                    item.getSoLuong()
            );

            chiTiet.setDonGia(
                    donGia
            );

            chiTiet.setTongTien(
                    thanhTien
            );

            chiTietRepository.save(chiTiet);

            responseItems.add(
                    new DonHangResponse.ChiTietResponse(
                            sanPham.getMaSanPham(),
                            sanPham.getTenSanPham(),
                            item.getSoLuong(),
                            donGia,
                            thanhTien
                    )
            );
        }

        // =========================
        // CẬP NHẬT TỔNG TIỀN
        // =========================

        donHang.setTongTien(tongTien);

        donHangRepository.save(donHang);

        // =========================
        // BÀN CÓ KHÁCH
        // =========================

        ban.setTrangThai(1);

        banRepository.save(ban);

        // =========================
        // REALTIME BÀN
        // =========================

        Map<String, Object> tableNotification =
                new HashMap<>();

        tableNotification.put(
                "maBan",
                ban.getMaBan()
        );

        tableNotification.put(
                "tenBan",
                ban.getTenBan()
        );

        tableNotification.put(
                "trangThai",
                ban.getTrangThai()
        );

        messagingTemplate.convertAndSend(
                "/topic/tables",
                tableNotification
        );

        // =========================
        // REALTIME ĐƠN MỚI
        // =========================

        orderWebSocketService.notifyNewOrder(
                new OrderNotification(
                        donHang.getMaDonHang(),
                        ban.getMaBan(),
                        ban.getTenBan(),
                        tongTien
                )
        );

        // =========================
        // RESPONSE
        // =========================

        return new DonHangResponse(
                donHang.getMaDonHang(),
                ban.getMaBan(),
                ban.getTenBan(),
                donHang.getMaPhien(),
                tongTien,
                donHang.getTrangThai(),
                donHang.getNgayDat(),
                responseItems
        );
    }

    // =========================
    // LẤY ĐƠN THEO ID
    // =========================

    @Transactional(readOnly = true)
    public DonHangResponse getById(Integer id) {

        DonHang donHang =
                donHangRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Không tìm thấy đơn hàng."
                                )
                        );

        DonHangBan donHangBan =
                donHangBanRepository
                        .findByMaDonHang(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Đơn hàng chưa gắn với bàn."
                                )
                        );

        Ban ban =
                donHangBan.getBan();

        List<DonHangResponse.ChiTietResponse> items =
                chiTietRepository
                        .findByMaDonHang(id)
                        .stream()
                        .map(ct -> {

                            SanPham sp =
                                    sanPhamRepository
                                            .findById(
                                                    ct.getMaSanPham()
                                            )
                                            .orElse(null);

                            return new DonHangResponse.ChiTietResponse(
                                    ct.getMaSanPham(),
                                    sp != null
                                            ? sp.getTenSanPham()
                                            : ct.getMaSanPham(),
                                    ct.getSoLuong(),
                                    ct.getDonGia(),
                                    ct.getTongTien()
                            );
                        })
                        .toList();

        return new DonHangResponse(
                donHang.getMaDonHang(),
                ban.getMaBan(),
                ban.getTenBan(),
                donHang.getMaPhien(),
                donHang.getTongTien(),
                donHang.getTrangThai(),
                donHang.getNgayDat(),
                items
        );
    }

    // =========================
    // LẤY TẤT CẢ ĐƠN
    // =========================

    @Transactional(readOnly = true)
    public List<DonHangResponse> getAll() {

        return donHangRepository
                .findAll(
                        org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC,
                                "ngayDat"
                        )
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================
    // CẬP NHẬT TRẠNG THÁI ĐƠN
    // =========================

    @Transactional
    public DonHangResponse updateTrangThai(
            Integer id,
            Integer trangThai
    ) {

        if (trangThai == null
                || trangThai < 0
                || trangThai > 3) {

            throw new IllegalArgumentException(
                    "Trạng thái phải từ 0 đến 3."
            );
        }

        DonHang donHang =
                donHangRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Không tìm thấy đơn hàng."
                                )
                        );

        DonHangBan donHangBan =
                donHangBanRepository
                        .findByMaDonHang(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Đơn hàng chưa gắn với bàn."
                                )
                        );

        // =========================
        // CHỈ ĐỔI TRẠNG THÁI ĐƠN
        // =========================

        donHang.setTrangThai(trangThai);

        donHangRepository.save(donHang);

        // =========================
        // REALTIME TRẠNG THÁI ĐƠN
        // =========================

        messagingTemplate.convertAndSend(
                "/topic/order-status",
                toResponse(donHang)
        );

        /*
         * QUAN TRỌNG:
         *
         * Không được đóng phiên ở đây.
         *
         * Đơn hoàn thành  -> phiên vẫn mở
         * Đơn bị hủy      -> phiên vẫn mở
         *
         * Khách vẫn có thể gọi thêm món.
         *
         * Chỉ khi khách thanh toán:
         *      PhienBan.trangThai = 0
         *      Ban.trangThai = 0
         */

        return toResponse(donHang);
    }

    // =========================
// THANH TOÁN PHIÊN
// =========================
    @Transactional
    public void thanhToanPhien(Integer maPhien) {

        if (maPhien == null) {
            throw new IllegalArgumentException(
                    "Mã phiên không được để trống."
            );
        }

        // Khóa bản ghi phiên trong transaction
        PhienBan phienBan =
                phienBanRepository
                        .findByIdForUpdate(maPhien)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Không tìm thấy phiên."
                                )
                        );

        // =========================
        // ĐÃ THANH TOÁN
        // =========================
        if (phienBan.getTrangThai() == 0) {
            throw new IllegalArgumentException(
                    "Phiên này đã được thanh toán."
            );
        }

        Ban ban = phienBan.getBan();

        // =========================
        // ĐÓNG PHIÊN
        // =========================
        phienBan.setTrangThai(0);
        phienBan.setThoiGianDong(
                LocalDateTime.now()
        );

        phienBanRepository.save(phienBan);

        // =========================
        // TRẢ BÀN
        // =========================
        if (ban != null) {

            ban.setTrangThai(0);

            banRepository.save(ban);

            // =========================
            // SOCKET: BÀN TRỐNG
            // =========================

            Map<String, Object> tableNotification =
                    new HashMap<>();

            tableNotification.put(
                    "maBan",
                    ban.getMaBan()
            );

            tableNotification.put(
                    "tenBan",
                    ban.getTenBan()
            );

            tableNotification.put(
                    "trangThai",
                    0
            );

            messagingTemplate.convertAndSend(
                    "/topic/tables",
                    tableNotification
            );
        }

        // =========================
        // SOCKET: PHIÊN ĐÃ THANH TOÁN
        // =========================

        Map<String, Object> sessionNotification =
                new HashMap<>();

        sessionNotification.put(
                "maPhien",
                phienBan.getMaPhien()
        );

        sessionNotification.put(
                "maBan",
                ban != null
                        ? ban.getMaBan()
                        : null
        );

        sessionNotification.put(
                "trangThai",
                0
        );

        sessionNotification.put(
                "thoiGianDong",
                phienBan.getThoiGianDong()
        );

        messagingTemplate.convertAndSend(
                "/topic/session-status",
                sessionNotification
        );
    }

    // =========================
    // CHUYỂN ĐƠN → RESPONSE
    // =========================

    private DonHangResponse toResponse(
            DonHang donHang
    ) {

        DonHangBan donHangBan =
                donHangBanRepository
                        .findByMaDonHang(
                                donHang.getMaDonHang()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Đơn hàng chưa gắn với bàn."
                                )
                        );

        Ban ban =
                donHangBan.getBan();

        List<DonHangResponse.ChiTietResponse> items =
                chiTietRepository
                        .findByMaDonHang(
                                donHang.getMaDonHang()
                        )
                        .stream()
                        .map(ct -> {

                            SanPham sp =
                                    sanPhamRepository
                                            .findById(
                                                    ct.getMaSanPham()
                                            )
                                            .orElse(null);

                            return new DonHangResponse.ChiTietResponse(
                                    ct.getMaSanPham(),
                                    sp != null
                                            ? sp.getTenSanPham()
                                            : ct.getMaSanPham(),
                                    ct.getSoLuong(),
                                    ct.getDonGia(),
                                    ct.getTongTien()
                            );
                        })
                        .toList();

        return new DonHangResponse(
                donHang.getMaDonHang(),
                ban.getMaBan(),
                ban.getTenBan(),
                donHang.getMaPhien(),
                donHang.getTongTien(),
                donHang.getTrangThai(),
                donHang.getNgayDat(),
                items
        );
    }


}