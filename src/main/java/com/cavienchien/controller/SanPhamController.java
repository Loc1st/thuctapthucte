package com.cavienchien.controller;

import com.cavienchien.entity.DanhMuc;
import com.cavienchien.entity.SanPham;
import com.cavienchien.repository.DanhMucRepository;
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
    private final DanhMucRepository danhMucRepository;

    /*
     * Thư mục lưu ảnh upload:
     *
     * project/
     * └── uploads/
     *     └── images/
     */
    private final Path imageDirectory =
            Paths.get("uploads", "images")
                    .toAbsolutePath()
                    .normalize();

    public SanPhamController(
            SanPhamRepository repository,
            DanhMucRepository danhMucRepository
    ) {
        this.repository = repository;
        this.danhMucRepository = danhMucRepository;
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

            @RequestParam("tensanpham")
            String tenSanPham,

            @RequestParam("giaban")
            BigDecimal giaBan,

            @RequestParam(
                    value = "mota",
                    required = false
            )
            String moTa,

            @RequestParam("madanhmuc")
            Integer maDanhMuc,

            @RequestPart(
                    value = "imageFile",
                    required = false
            )
            MultipartFile imageFile

    ) {

        // -------------------------
        // Validate tên
        // -------------------------

        if (tenSanPham == null ||
                tenSanPham.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên món không được để trống.");
        }

        // -------------------------
        // Validate giá
        // -------------------------

        if (giaBan == null ||
                giaBan.signum() < 0) {

            return ResponseEntity
                    .badRequest()
                    .body("Giá bán không hợp lệ.");
        }

        // -------------------------
        // Validate danh mục
        // -------------------------

        if (maDanhMuc == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng chọn danh mục.");
        }

        DanhMuc danhMuc =
                danhMucRepository
                        .findById(maDanhMuc)
                        .orElse(null);

        if (danhMuc == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Danh mục không tồn tại.");
        }

        try {

            // -------------------------
            // Lưu ảnh
            // -------------------------

            String imagePath =
                    saveImage(imageFile);

            // -------------------------
            // Tạo sản phẩm
            // -------------------------

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
             * Hiện tại dự án chưa quản lý tồn kho.
             */
            product.setSoLuong(null);

            /*
             * Gán danh mục.
             */
            product.setDanhMuc(
                    danhMuc
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            repository.save(product)
                    );

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

            @RequestParam("madanhmuc")
            Integer maDanhMuc,

            @RequestPart(
                    value = "imageFile",
                    required = false
            )
            MultipartFile imageFile

    ) {

        // -------------------------
        // Validate tên
        // -------------------------

        if (tenSanPham == null ||
                tenSanPham.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Tên món không được để trống.");
        }

        // -------------------------
        // Validate giá
        // -------------------------

        if (giaBan == null ||
                giaBan.signum() < 0) {

            return ResponseEntity
                    .badRequest()
                    .body("Giá bán không hợp lệ.");
        }

        // -------------------------
        // Validate danh mục
        // -------------------------

        if (maDanhMuc == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Vui lòng chọn danh mục.");
        }

        DanhMuc danhMuc =
                danhMucRepository
                        .findById(maDanhMuc)
                        .orElse(null);

        if (danhMuc == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Danh mục không tồn tại.");
        }

        // -------------------------
        // Tìm sản phẩm
        // -------------------------

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
                         * Cập nhật danh mục.
                         */
                        product.setDanhMuc(
                                danhMuc
                        );

                        /*
                         * Nếu chọn ảnh mới:
                         * lưu ảnh mới và cập nhật đường dẫn.
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
                                .ok(
                                        repository.save(product)
                                );

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
                                    + "đang được sử dụng trong "
                                    + "lịch sử đơn hàng."
                    );
        }
    }

    // =========================================================
    // SAVE IMAGE
    // =========================================================

    private String saveImage(
            MultipartFile imageFile
    ) throws IOException {

        /*
         * Không chọn ảnh thì không làm gì.
         */
        if (imageFile == null ||
                imageFile.isEmpty()) {

            return null;
        }

        // -------------------------
        // Kiểm tra loại file
        // -------------------------

        String contentType =
                imageFile.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new IOException(
                    "File được chọn không phải hình ảnh."
            );
        }

        // -------------------------
        // Giới hạn 5MB
        // -------------------------

        if (imageFile.getSize() >
                5 * 1024 * 1024) {

            throw new IOException(
                    "Hình ảnh không được vượt quá 5MB."
            );
        }

        // -------------------------
        // Tạo thư mục
        // -------------------------

        Files.createDirectories(
                imageDirectory
        );

        // -------------------------
        // Lấy extension
        // -------------------------

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

        // -------------------------
        // Tạo tên file mới
        // -------------------------

        String fileName =
                UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        + extension;

        Path target =
                imageDirectory
                        .resolve(fileName)
                        .normalize();

        // -------------------------
        // Chống path traversal
        // -------------------------

        if (!target.startsWith(
                imageDirectory
        )) {

            throw new IOException(
                    "Đường dẫn file không hợp lệ."
            );
        }

        // -------------------------
        // Copy file
        // -------------------------

        Files.copy(
                imageFile.getInputStream(),
                target,
                StandardCopyOption.REPLACE_EXISTING
        );

        /*
         * DB chỉ lưu path tương đối.
         *
         * Ví dụ:
         * images/abc123.jpg
         */
        return "images/" + fileName;
    }

    // =========================================================
    // GENERATE ID
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
    // STRING HELPER
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