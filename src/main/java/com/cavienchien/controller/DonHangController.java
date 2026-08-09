package com.cavienchien.controller;

import com.cavienchien.dto.DatMonRequest;
import com.cavienchien.dto.DonHangResponse;
import com.cavienchien.service.DonHangService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/don-hang")
public class DonHangController {
    private final DonHangService service;

    public DonHangController(DonHangService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DonHangResponse datMon(@RequestBody DatMonRequest request) {
        try {
            return service.datMon(request);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping
    public List<DonHangResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public DonHangResponse getById(@PathVariable Integer id) {
        try {
            return service.getById(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PatchMapping("/{id}/trang-thai")
    public DonHangResponse updateStatus(@PathVariable Integer id, @RequestParam Integer trangThai) {
        try {
            return service.updateTrangThai(id, trangThai);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PostMapping("/phien/{maPhien}/thanh-toan")
    public void thanhToanPhien(
            @PathVariable Integer maPhien
    ) {
        try {

            service.thanhToanPhien(maPhien);

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    e.getMessage()
            );
        }
    }
}
