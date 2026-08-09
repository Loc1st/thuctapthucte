CREATE TABLE IF NOT EXISTS phienban (
                                        maphien INT AUTO_INCREMENT PRIMARY KEY,
                                        maban INT NOT NULL,
                                        thoigianmo DATETIME NOT NULL,
                                        thoigiandong DATETIME NULL,
                                        trangthai INT NOT NULL DEFAULT 1,

                                        CONSTRAINT fk_phienban_ban
                                        FOREIGN KEY (maban)
    REFERENCES ban(maban)
    );