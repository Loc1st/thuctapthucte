package com.cavienchien.controller;

import com.cavienchien.entity.DanhMuc;
import com.cavienchien.repository.DanhMucRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/danh-muc")
@CrossOrigin(origins = "*")
public class DanhMucController {

    private final DanhMucRepository repository;

    public DanhMucController(DanhMucRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<DanhMuc> getAll() {
        return repository.findAll();
    }
}