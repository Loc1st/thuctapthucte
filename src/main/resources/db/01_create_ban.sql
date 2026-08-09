CREATE TABLE IF NOT EXISTS ban (
    maban INT NOT NULL AUTO_INCREMENT,
    tenban VARCHAR(50) NOT NULL,
    trangthai INT NOT NULL DEFAULT 0 COMMENT '0: Trống, 1: Có khách, 2: Chờ thanh toán',
    maqr VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (maban),
    UNIQUE KEY uk_ban_maqr (maqr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO ban (tenban, trangthai, maqr)
SELECT 'Bàn 01', 0, 'ban-01' WHERE NOT EXISTS (SELECT 1 FROM ban WHERE tenban = 'Bàn 01');
INSERT INTO ban (tenban, trangthai, maqr)
SELECT 'Bàn 02', 0, 'ban-02' WHERE NOT EXISTS (SELECT 1 FROM ban WHERE tenban = 'Bàn 02');
INSERT INTO ban (tenban, trangthai, maqr)
SELECT 'Bàn 03', 0, 'ban-03' WHERE NOT EXISTS (SELECT 1 FROM ban WHERE tenban = 'Bàn 03');
INSERT INTO ban (tenban, trangthai, maqr)
SELECT 'Bàn 04', 0, 'ban-04' WHERE NOT EXISTS (SELECT 1 FROM ban WHERE tenban = 'Bàn 04');
INSERT INTO ban (tenban, trangthai, maqr)
SELECT 'Bàn 05', 0, 'ban-05' WHERE NOT EXISTS (SELECT 1 FROM ban WHERE tenban = 'Bàn 05');
INSERT INTO ban (tenban, trangthai, maqr)
SELECT 'Bàn 06', 0, 'ban-06' WHERE NOT EXISTS (SELECT 1 FROM ban WHERE tenban = 'Bàn 06');
