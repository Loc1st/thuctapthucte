# Ca Vien Chien

Spring Boot 3.5.4 + JPA + MySQL/MariaDB.

## API
- GET /api/san-pham
- GET /api/ban
- GET /api/ban/{id}
- POST /api/don-hang
- GET /api/don-hang
- GET /api/don-hang/{id}
- PATCH /api/don-hang/{id}/trang-thai?trangThai=0..3

## Trang
- Khách: http://localhost:8080/menu.html?ban=1
- Quản trị đơn hàng: http://localhost:8080/admin/index.html

## Trạng thái đơn
0 Chờ xác nhận
1 Đang làm
2 Hoàn thành
3 Đã hủy

## Lưu ý
Chạy db/01_create_ban.sql và db/02_create_donhang_ban.sql nếu chưa chạy.
Không thay đổi ddl-auto: none.
