// Interacao exclusiva da tela de login.
(function () {
    const passwordInput = document.getElementById("password");
    const togglePassword = document.querySelector(".login-v2-toggle");

    if (!togglePassword || !passwordInput) {
        return;
    }

    togglePassword.addEventListener("click", () => {
        const shouldShow = passwordInput.type === "password";
        passwordInput.type = shouldShow ? "text" : "password";
        togglePassword.setAttribute("aria-pressed", shouldShow ? "true" : "false");
        togglePassword.setAttribute("aria-label", shouldShow ? "Ocultar senha" : "Mostrar senha");
    });
})();
