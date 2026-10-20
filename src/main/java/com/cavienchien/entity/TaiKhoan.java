
package com.cavienchien.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "taikhoan")
public class TaiKhoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mataikhoan")
    private Integer maTaiKhoan;

    @Column(name = "tendangnhap", nullable = false, unique = true, length = 50)
    private String tenDangNhap;

    @Column(name = "matkhau", nullable = false, length = 255)
    private String matKhau;

    @Column(name = "hoten", nullable = false, length = 150)
    private String hoTen;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "vaitro", nullable = false)
    private VaiTro vaiTro = VaiTro.STAFF;

    @Enumerated(EnumType.STRING)
    @Column(name = "trangthai", nullable = false)
    private TrangThai trangThai = TrangThai.ACTIVE;

    @Column(name = "dangnhapcuoi")
    private LocalDateTime dangNhapCuoi;

    @Column(name = "ngaytao", insertable = false, updatable = false)
    private LocalDateTime ngayTao;

    @Column(name = "ngaycapnhat", insertable = false, updatable = false)
    private LocalDateTime ngayCapNhat;

    public enum VaiTro {
        ADMIN, STAFF
    }

    public enum TrangThai {
        ACTIVE, LOCKED
    }

    public Integer getMaTaiKhoan() {
        return maTaiKhoan;
    }

    public void setMaTaiKhoan(Integer maTaiKhoan) {
        this.maTaiKhoan = maTaiKhoan;
    }

    public String getTenDangNhap() {
        return tenDangNhap;
    }

    public void setTenDangNhap(String tenDangNhap) {
        this.tenDangNhap = tenDangNhap;
    }

    public String getMatKhau() {
        return matKhau;
    }

    public void setMatKhau(String matKhau) {
        this.matKhau = matKhau;
    }

    public String getHoTen() {
        return hoTen;
    }

    public void setHoTen(String hoTen) {
        this.hoTen = hoTen;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public VaiTro getVaiTro() {
        return vaiTro;
    }

    public void setVaiTro(VaiTro vaiTro) {
        this.vaiTro = vaiTro;
    }

    public TrangThai getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(TrangThai trangThai) {
        this.trangThai = trangThai;
    }

    public LocalDateTime getDangNhapCuoi() {
        return dangNhapCuoi;
    }

    public void setDangNhapCuoi(LocalDateTime dangNhapCuoi) {
        this.dangNhapCuoi = dangNhapCuoi;
    }

    public LocalDateTime getNgayTao() {
        return ngayTao;
    }

    public LocalDateTime getNgayCapNhat() {
        return ngayCapNhat;
    }
}
