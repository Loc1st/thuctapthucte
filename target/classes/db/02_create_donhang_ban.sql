USE quangbaamthuc;

CREATE TABLE IF NOT EXISTS donhangban (
    madonhang INT NOT NULL,
    maban INT NOT NULL,
    PRIMARY KEY (madonhang),
    KEY idx_donhangban_maban (maban),
    CONSTRAINT fk_dhb_donhang FOREIGN KEY (madonhang) REFERENCES donhang(madonhang),
    CONSTRAINT fk_dhb_ban FOREIGN KEY (maban) REFERENCES ban(maban)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
