/** ui.js – Petits utilitaires d'interface partagés (erreurs de formulaire, dates, notifications). */
const UI = (() => {
  const STATUS_LABELS = { pending: "En attente", in_progress: "En cours", completed: "Terminée" };

  // Échappe le HTML pour éviter d'injecter du code via un titre ou une description
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const formData = (form) => {
    const d = Object.fromEntries(new FormData(form));
    ["name", "email", "title"].forEach((k) => { if (typeof d[k] === "string") d[k] = d[k].trim(); });
    return d;
  };

  const setError = (form, name, msg) => {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    if (el) el.textContent = msg;
    if (form.elements[name]) form.elements[name].classList.add("invalid");
  };

  const clearErrors = (form) => {
    form.querySelectorAll("[data-error-for]").forEach((e) => (e.textContent = ""));
    form.querySelectorAll(".invalid").forEach((i) => i.classList.remove("invalid"));
    const g = form.querySelector(".form-error");
    if (g) g.textContent = "";
  };

  const formError = (form, msg) => {
    const g = form.querySelector(".form-error");
    if (g) g.textContent = msg;
  };

  const toast = (msg, type = "info") => {
    const el = document.createElement("div");
    el.className = "toast" + (type === "error" ? " error" : "");
    el.setAttribute("role", "status");
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  return { STATUS_LABELS, esc, fmtDate, formData, setError, clearErrors, formError, toast };
})();