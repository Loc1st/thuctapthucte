package com.cavienchien.controller;

import com.cavienchien.entity.SanPham;
import com.cavienchien.repository.SanPhamRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/san-pham")
@CrossOrigin(origins = "*")
public class SanPhamController {

    private final SanPhamRepository repository;

    /*
     * Thư mục lưu ảnh upload bên ngoài classpath
     */
    private final Path imageDirectory =
            Paths.get(
                    "uploads",
                    "images"
            ).toAbsolutePath().normalize();

    public SanPhamController(SanPhamRepository repository) {
        this.repository = repository;
    }

    // =========================================================
    // GET ALL
    // =========================================================

    @GetMapping
    public List<SanPham> getAll() {
        return repository.findAll();
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<SanPham> getById(
            @PathVariable String id
    ) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(
                        () -> ResponseEntity.notFound().build()
                );
    }

    // =========================================================
    // CREATE
    // =========================================================

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @RequestParam("tensanpham") String tenSanPham,
            @RequestParam("giaban") BigDecimal giaBan,
            @RequestParam(
                    value = "mota",
                    required = false
            ) String moTa,
            @RequestPart(
                    value = "imageFile",
                    required = false
            ) MultipartFile imageFile
    ) {

        // -------------------------
        // Validate
        // -------------------------

        if (tenSanPham == null ||
                tenSanPham.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên món không được để trống.");
        }

        if (giaBan == null ||
                giaBan.signum() < 0) {

            return ResponseEntity
                    .badRequest()
                    .body("Giá bán không hợp lệ.");
        }

        try {

            String imagePath =
                    saveImage(imageFile);

            SanPham product =
                    new SanPham();

            product.setMaSanPham(
                    generateId()
            );

            product.setTenSanPham(
                    tenSanPham.trim()
            );

            product.setGiaBan(
                    giaBan
            );

            product.setMoTa(
                    blankToNull(moTa)
            );

            product.setAnhSanPham(
                    imagePath
            );

            /*
             * Không quản lý số lượng
             * và danh mục.
             */
            product.setSoLuong(null);
            product.setDanhMuc(null);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(repository.save(product));

        } catch (IOException e) {

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(
                            "Không thể lưu hình ảnh: "
                                    + e.getMessage()
                    );
        }
    }

    // =========================================================
    // UPDATE
    // =========================================================

    @PutMapping(
            value = "/{id}",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<?> update(
            @PathVariable String id,

            @RequestParam("tensanpham")
            String tenSanPham,

            @RequestParam("giaban")
            BigDecimal giaBan,

            @RequestParam(
                    value = "mota",
                    required = false
            )
            String moTa,

            @RequestPart(
                    value = "imageFile",
                    required = false
            )
            MultipartFile imageFile
    ) {

        // -------------------------
        // Validate
        // -------------------------

        if (tenSanPham == null ||
                tenSanPham.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên món không được để trống.");
        }

        if (giaBan == null ||
                giaBan.signum() < 0) {

            return ResponseEntity
                    .badRequest()
                    .body("Giá bán không hợp lệ.");
        }

        return repository.findById(id)
                .map(product -> {

                    try {

                        product.setTenSanPham(
                                tenSanPham.trim()
                        );

                        product.setGiaBan(
                                giaBan
                        );

                        product.setMoTa(
                                blankToNull(moTa)
                        );

                        /*
                         * Nếu chọn ảnh mới:
                         * lưu ảnh mới.
                         *
                         * Nếu không chọn:
                         * giữ ảnh cũ.
                         */
                        if (imageFile != null &&
                                !imageFile.isEmpty()) {

                            String newImage =
                                    saveImage(imageFile);

                            product.setAnhSanPham(
                                    newImage
                            );
                        }

                        return ResponseEntity
                                .ok(repository.save(product));

                    } catch (IOException e) {

                        return ResponseEntity
                                .status(
                                        HttpStatus.INTERNAL_SERVER_ERROR
                                )
                                .body(
                                        "Không thể lưu hình ảnh: "
                                                + e.getMessage()
                                );
                    }

                })
                .orElseGet(
                        () -> ResponseEntity
                                .notFound()
                                .build()
                );
    }

    // =========================================================
    // DELETE
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable String id
    ) {

        if (!repository.existsById(id)) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        try {

            repository.deleteById(id);
            repository.flush();

            return ResponseEntity
                    .noContent()
                    .build();

        } catch (DataIntegrityViolationException e) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(
                            "Không thể xóa món vì món này "
                                    + "đang được sử dụng trong lịch sử đơn hàng."
                    );
        }
    }

    // =========================================================
    // SAVE IMAGE
    // =========================================================

    private String saveImage(
            MultipartFile imageFile
    ) throws IOException {

        if (imageFile == null ||
                imageFile.isEmpty()) {

            return null;
        }

        // Chỉ nhận ảnh
        String contentType =
                imageFile.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IOException(
                    "File được chọn không phải hình ảnh."
            );
        }

        // Giới hạn 5MB
        if (imageFile.getSize() >
                5 * 1024 * 1024) {

            throw new IOException(
                    "Hình ảnh không được vượt quá 5MB."
            );
        }

        Files.createDirectories(
                imageDirectory
        );

        String originalName =
                imageFile.getOriginalFilename();

        String extension = "";

        if (originalName != null &&
                originalName.contains(".")) {

            extension =
                    originalName.substring(
                            originalName.lastIndexOf(".")
                    ).toLowerCase();
        }

        /*
         * Không dùng tên file gốc để tránh
         * lỗi tiếng Việt / khoảng trắng / trùng tên.
         */
        String fileName =
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        + extension;

        Path target =
                imageDirectory
                        .resolve(fileName)
                        .normalize();

        /*
         * Chống path traversal.
         */
        if (!target.startsWith(
                imageDirectory
        )) {

            throw new IOException(
                    "Đường dẫn file không hợp lệ."
            );
        }

        Files.copy(
                imageFile.getInputStream(),
                target,
                StandardCopyOption.REPLACE_EXISTING
        );

        /*
         * Giá trị lưu DB:
         *
         * images/abc123.jpg
         */
        return "images/" + fileName;
    }

    // =========================================================
    // ID
    // =========================================================

    private String generateId() {

        String id;

        do {

            id =
                    "SP"
                            + UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 12)
                            .toUpperCase();

        } while (
                repository.existsById(id)
        );

        return id;
    }

    // =========================================================
    // STRING
    // =========================================================

    private String blankToNull(
            String value
    ) {

        return value == null ||
                value.isBlank()
                ? null
                : value.trim();
    }
}