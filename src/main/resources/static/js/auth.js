document.addEventListener("DOMContentLoaded", async () => {

    const currentPath = window.location.pathname;

    const isAdminPage =
        currentPath.startsWith("/admin/");

    const isStaffPage =
        currentPath.startsWith("/staff/");

    // Không xử lý các trang khác
    if (!isAdminPage && !isStaffPage) {
        return;
    }

    try {

        const response = await fetch(
            "/api/auth/me",
            {
                method: "GET",
                credentials: "same-origin"
            }
        );

        // Chưa đăng nhập
        if (response.status === 401) {

            redirectToLogin();
            return;
        }

        if (!response.ok) {

            redirectToLogin();
            return;
        }

        const data = await response.json();

        if (!data.success) {

            redirectToLogin();
            return;
        }

        const role = data.role;

        // =========================
        // ADMIN PAGE
        // =========================

        if (isAdminPage) {

            if (role !== "ADMIN") {

                alert(
                    "Bạn không có quyền truy cập khu vực Admin."
                );

                window.location.href =
                    "/staff/index.html";

                return;
            }
        }


        // =========================
        // STAFF PAGE
        // =========================

        if (isStaffPage) {

            if (
                role !== "STAFF" &&
                role !== "ADMIN"
            ) {

                redirectToLogin();
                return;
            }
        }


        // =========================
        // HIỂN THỊ TÊN / ROLE
        // =========================

        updateUserInfo(
            data.username,
            data.role
        );


        // =========================
        // LOGOUT
        // =========================

        const logoutBtn =
            document.getElementById("logoutBtn");

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                logout
            );
        }

    } catch (error) {

        console.error(
            "Auth check error:",
            error
        );

        redirectToLogin();
    }
});


function updateUserInfo(
    username,
    role
) {

    const usernameElements =
        document.querySelectorAll(
            "[data-username]"
        );

    usernameElements.forEach(element => {

        element.textContent = username;

    });


    const roleElements =
        document.querySelectorAll(
            "[data-role]"
        );

    roleElements.forEach(element => {

        element.textContent = role;

    });
}


async function logout() {

    try {

        await fetch(
            "/api/auth/logout",
            {
                method: "POST",
                credentials: "same-origin"
            }
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    } finally {

        sessionStorage.removeItem(
            "username"
        );

        sessionStorage.removeItem(
            "role"
        );

        window.location.href =
            "/login.html";
    }
}


function redirectToLogin() {

    sessionStorage.removeItem(
        "username"
    );

    sessionStorage.removeItem(
        "role"
    );

    window.location.href =
        "/login.html";
}