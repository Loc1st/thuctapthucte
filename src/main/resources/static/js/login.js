document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("message");

    if (!form) {
        console.error("Không tìm thấy #loginForm");
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            showMessage("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        try {

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showMessage(
                    data.message || "Đăng nhập thất bại."
                );
                return;
            }

            // Không lưu password.
            // Session được backend quản lý bằng cookie.
            sessionStorage.setItem(
                "username",
                data.username
            );

            sessionStorage.setItem(
                "role",
                data.role
            );

            // =========================
            // CHUYỂN TRANG THEO ROLE
            // =========================

            if (data.role === "ADMIN") {

                window.location.href =
                    "/admin/index.html";

            } else if (data.role === "STAFF") {

                window.location.href =
                    "/staff/index.html";

            } else {

                showMessage(
                    "Role tài khoản không hợp lệ."
                );
            }

        } catch (error) {

            console.error("Login error:", error);

            showMessage(
                "Không thể kết nối tới máy chủ."
            );
        }
    });


    function showMessage(text) {

        if (message) {
            message.textContent = text;
            message.style.display = "block";
        } else {
            alert(text);
        }
    }

});