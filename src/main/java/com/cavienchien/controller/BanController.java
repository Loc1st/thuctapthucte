package com.cavienchien.controller;

import com.cavienchien.entity.Ban;
import com.cavienchien.repository.BanRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ban")
@CrossOrigin(origins = "*")
public class BanController {
    private final BanRepository repository;

    public BanController(BanRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Ban> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ban> getById(@PathVariable Integer id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Ban> create(@RequestBody Ban ban) {
        ban.setMaBan(null);
        if (ban.getTrangThai() == null) {
            ban.setTrangThai(0);
        }
        return ResponseEntity.ok(repository.save(ban));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ban> update(@PathVariable Integer id, @RequestBody Ban request) {
        return repository.findById(id).map(ban -> {
            ban.setTenBan(request.getTenBan());
            ban.setTrangThai(request.getTrangThai());
            ban.setMaQr(request.getMaQr());
            return ResponseEntity.ok(repository.save(ban));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
