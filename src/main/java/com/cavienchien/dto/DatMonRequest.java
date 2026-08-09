package com.cavienchien.dto;

import java.util.List;

public class DatMonRequest {
    private Integer maBan;
    private List<MonDatRequest> items;

    public Integer getMaBan() { return maBan; }
    public List<MonDatRequest> getItems() { return items; }
    public void setMaBan(Integer value) { maBan = value; }
    public void setItems(List<MonDatRequest> value) { items = value; }
}
