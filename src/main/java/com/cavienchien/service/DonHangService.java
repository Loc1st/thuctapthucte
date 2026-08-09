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
    private final OrderWebSocketService orderWebSocketService;
    private final SimpMessagingTemplate messagingTemplate;

    public DonHangService(
            DonHangRepository donHangRepository,
            ChiTietDonHangRepository chiTietRepository,
            DonHangBanRepository donHangBanRepository,
            BanRepository banRepository,
            SanPhamRepository sanPhamRepository,
            OrderWebSocketService orderWebSocketService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.donHangRepository = donHangRepository;
        this.chiTietRepository = chiTietRepository;
        this.donHangBanRepository = donHangBanRepository;
        this.banRepository = banRepository;
        this.sanPhamRepository = sanPhamRepository;
        this.orderWebSocketService = orderWebSocketService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public DonHangResponse datMon(DatMonRequest request) {
        if (request == null || request.getMaBan() == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Bàn và danh sách món không được để trống.");
        }

        Ban ban = banRepository.findById(request.getMaBan())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bàn."));

        DonHang donHang = new DonHang();
        donHang.setTongTien(BigDecimal.ZERO);
        donHang.setPhuongThucThanhToan("TAI_QUAY");
        donHang.setTrangThai(0);
        donHang = donHangRepository.save(donHang);

        DonHangBan donHangBan = new DonHangBan();
        donHangBan.setDonHang(donHang);
        donHangBan.setBan(ban);
        donHangBanRepository.save(donHangBan);

        BigDecimal tongTien = BigDecimal.ZERO;
        List<DonHangResponse.ChiTietResponse> responseItems = new ArrayList<>();

        for (MonDatRequest item : request.getItems()) {
            if (item.getMaSanPham() == null || item.getSoLuong() == null || item.getSoLuong() <= 0) {
                throw new IllegalArgumentException("Sản phẩm hoặc số lượng không hợp lệ.");
            }

            SanPham sanPham = sanPhamRepository.findById(item.getMaSanPham())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm: " + item.getMaSanPham()));

            BigDecimal donGia = sanPham.getGiaBan();
            BigDecimal thanhTien = donGia.multiply(BigDecimal.valueOf(item.getSoLuong()));
            tongTien = tongTien.add(thanhTien);

            ChiTietDonHang chiTiet = new ChiTietDonHang();
            chiTiet.setMaDonHang(donHang.getMaDonHang());
            chiTiet.setMaSanPham(sanPham.getMaSanPham());
            chiTiet.setSoLuong(item.getSoLuong());
            chiTiet.setDonGia(donGia);
            chiTiet.setTongTien(thanhTien);
            chiTietRepository.save(chiTiet);

            responseItems.add(new DonHangResponse.ChiTietResponse(
                    sanPham.getMaSanPham(), sanPham.getTenSanPham(), item.getSoLuong(), donGia, thanhTien
            ));
        }

        donHang.setTongTien(tongTien);
        donHangRepository.save(donHang);

// 0 = trống, 1 = có khách
        ban.setTrangThai(1);
        banRepository.save(ban);

        Map<String, Object> tableNotification = new HashMap<>();
        tableNotification.put("maBan", ban.getMaBan());
        tableNotification.put("tenBan", ban.getTenBan());
        tableNotification.put("trangThai", ban.getTrangThai());

        messagingTemplate.convertAndSend(
                "/topic/tables",
                tableNotification
        );

// Gửi thông báo đơn mới đến Admin qua WebSocket
        orderWebSocketService.notifyNewOrder(
                new OrderNotification(
                        donHang.getMaDonHang(),
                        ban.getMaBan(),
                        ban.getTenBan(),
                        tongTien
                )
        );

        return new DonHangResponse(
                donHang.getMaDonHang(), ban.getMaBan(), ban.getTenBan(), tongTien,
                donHang.getTrangThai(), donHang.getNgayDat(), responseItems
        );
    }

    @Transactional(readOnly = true)
    public DonHangResponse getById(Integer id) {
        DonHang donHang = donHangRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng."));
        DonHangBan donHangBan = donHangBanRepository.findByMaDonHang(id)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng chưa gắn với bàn."));
        Ban ban = donHangBan.getBan();

        List<DonHangResponse.ChiTietResponse> items = chiTietRepository.findByMaDonHang(id).stream().map(ct -> {
            SanPham sp = sanPhamRepository.findById(ct.getMaSanPham()).orElse(null);
            return new DonHangResponse.ChiTietResponse(
                    ct.getMaSanPham(), sp != null ? sp.getTenSanPham() : ct.getMaSanPham(),
                    ct.getSoLuong(), ct.getDonGia(), ct.getTongTien()
            );
        }).toList();

        return new DonHangResponse(donHang.getMaDonHang(), ban.getMaBan(), ban.getTenBan(),
                donHang.getTongTien(), donHang.getTrangThai(), donHang.getNgayDat(), items);
    }
    @Transactional(readOnly = true)
    public List<DonHangResponse> getAll() {
        return donHangRepository.findAll(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "ngayDat"
        )).stream().map(this::toResponse).toList();
    }

    @Transactional
    public DonHangResponse updateTrangThai(Integer id, Integer trangThai) {

        if (trangThai == null || trangThai < 0 || trangThai > 3) {
            throw new IllegalArgumentException(
                    "Trạng thái phải từ 0 đến 3."
            );
        }

        DonHang donHang = donHangRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy đơn hàng."
                        )
                );

        DonHangBan donHangBan =
                donHangBanRepository.findByMaDonHang(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Đơn hàng chưa gắn với bàn."
                                )
                        );

        donHang.setTrangThai(trangThai);
        donHangRepository.save(donHang);

// Thông báo trạng thái đơn hàng realtime
        messagingTemplate.convertAndSend(
                "/topic/order-status",
                toResponse(donHang)
        );

        // 2 = Hoàn thành
        // 3 = Hủy
        if (trangThai == 2 || trangThai == 3) {

            boolean hasActiveOrder =
                    donHangBanRepository
                            .findByBan_MaBan(
                                    donHangBan.getBan().getMaBan()
                            )
                            .stream()
                            .map(DonHangBan::getDonHang)
                            .anyMatch(dh ->
                                    !dh.getMaDonHang().equals(id)
                                            && dh.getTrangThai() != null
                                            && dh.getTrangThai() != 2
                                            && dh.getTrangThai() != 3
                            );

            if (!hasActiveOrder) {

                Ban ban = donHangBan.getBan();

                ban.setTrangThai(0);
                banRepository.save(ban);

                // Không gửi entity Ban trực tiếp
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
            }
        }

        return toResponse(donHang);
    }

    private DonHangResponse toResponse(DonHang donHang) {
        DonHangBan donHangBan = donHangBanRepository.findByMaDonHang(donHang.getMaDonHang())
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng chưa gắn với bàn."));
        Ban ban = donHangBan.getBan();
        List<DonHangResponse.ChiTietResponse> items = chiTietRepository.findByMaDonHang(donHang.getMaDonHang()).stream().map(ct -> {
            SanPham sp = sanPhamRepository.findById(ct.getMaSanPham()).orElse(null);
            return new DonHangResponse.ChiTietResponse(
                    ct.getMaSanPham(), sp != null ? sp.getTenSanPham() : ct.getMaSanPham(),
                    ct.getSoLuong(), ct.getDonGia(), ct.getTongTien()
            );
        }).toList();
        return new DonHangResponse(donHang.getMaDonHang(), ban.getMaBan(), ban.getTenBan(),
                donHang.getTongTien(), donHang.getTrangThai(), donHang.getNgayDat(), items);
    }

}
