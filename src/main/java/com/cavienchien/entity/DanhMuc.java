package com.cavienchien.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "danhmuc")
public class DanhMuc {

    @Id
    @Column(name = "madanhmuc")
    private Integer maDanhMuc;

    @Column(name = "tendanhmuc", nullable = false, length = 150)
    private String tenDanhMuc;

    public Integer getMaDanhMuc() {
        return maDanhMuc;
    }

    public void setMaDanhMuc(Integer maDanhMuc) {
        this.maDanhMuc = maDanhMuc;
    }

    public String getTenDanhMuc() {
        return tenDanhMuc;
    }

    public void setTenDanhMuc(String tenDanhMuc) {
        this.tenDanhMuc = tenDanhMuc;
    }
}