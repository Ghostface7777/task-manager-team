/** auth.js – Connexion, inscription, déconnexion et protection des pages. */
(() => {
  const page = document.body.dataset.page;
  const user = API.currentUser();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Protection des pages : tableau de bord réservé aux connectés
  if (page === "dashboard" && !user) { location.replace("login.html"); return; }
  if ((page === "login" || page === "register") && user) { location.replace("index.html"); return; }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      UI.clearErrors(loginForm);
      const d = UI.formData(loginForm);
      let ok = true;
      if (!d.email) { UI.setError(loginForm, "email", "Saisissez votre adresse e-mail."); ok = false; }
      else if (!EMAIL_RE.test(d.email)) { UI.setError(loginForm, "email", "Cette adresse e-mail n'est pas valide."); ok = false; }
      if (!d.password) { UI.setError(loginForm, "password", "Saisissez votre mot de passe."); ok = false; }
      if (!ok) return;
      try {
        await API.login(d);
        location.href = "index.html";
      } catch (err) {
        UI.formError(loginForm, err.message);
      }
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      UI.clearErrors(registerForm);
      const d = UI.formData(registerForm);
      let ok = true;
      const bad = (field, msg) => { UI.setError(registerForm, field, msg); ok = false; };
      if (d.name.length < 2) bad("name", "Saisissez votre nom complet (2 caractères minimum).");
      if (!d.email) bad("email", "Saisissez votre adresse e-mail.");
      else if (!EMAIL_RE.test(d.email)) bad("email", "Cette adresse e-mail n'est pas valide.");
      if (d.password.length < 8) bad("password", "Le mot de passe doit contenir au moins 8 caractères.");
      if (!d.confirm) bad("confirm", "Confirmez votre mot de passe.");
      else if (d.confirm !== d.password) bad("confirm", "Les mots de passe ne correspondent pas.");
      if (!ok) return;
      try {
        await API.register(d);
        location.href = "index.html";
      } catch (err) {
        UI.formError(registerForm, err.message);
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      API.logout();
      location.href = "login.html";
    });
  }
})();