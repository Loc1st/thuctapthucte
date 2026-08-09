package com.cavienchien.controller;

import com.cavienchien.entity.SanPham;
import com.cavienchien.repository.SanPhamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/san-pham")
@CrossOrigin(origins = "*")
public class SanPhamController {
    private final SanPhamRepository repository;

    public SanPhamController(SanPhamRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<SanPham> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SanPham> getById(@PathVariable String id) {
        return repository.findById(id).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
