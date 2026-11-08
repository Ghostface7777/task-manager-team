/** tasks.js – Logique du tableau de bord : liste, statistiques, filtres, modale d'ajout/modification. */
(() => {
  if (document.body.dataset.page !== "dashboard") return;
  const user = API.currentUser();
  if (!user) return; // auth.js redirige déjà vers la connexion

  const $ = (id) => document.getElementById(id);
  const list = $("task-list"), dialog = $("task-dialog"), form = $("task-form");
  const state = { tasks: [], filter: "all", view: "dashboard", editingId: null };

  // Bouton de changement de statut : pending -> in_progress -> completed -> pending
  const NEXT = {
    pending: { to: "in_progress", label: "Démarrer" },
    in_progress: { to: "completed", label: "Terminer" },
    completed: { to: "pending", label: "Rouvrir" },
  };
  const VIEW_TITLES = { dashboard: "Toutes les tâches", tasks: "Mes tâches", done: "Tâches terminées" };

  $("greeting").textContent = `Bonjour, ${user.name} 👋`;

  const visibleTasks = () =>
    state.tasks
      .filter((t) => (state.view === "done" ? t.status === "completed" : state.filter === "all" || t.status === state.filter))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  function cardHtml(t) {
    const n = NEXT[t.status];
    return `<article class="task ${t.status}" data-id="${t.id}">
      <div>
        <h3>${UI.esc(t.title)}</h3>
        ${t.description ? `<p>${UI.esc(t.description)}</p>` : ""}
        <div class="meta"><span class="badge ${t.status}">${UI.STATUS_LABELS[t.status]}</span><span>Créée le ${UI.fmtDate(t.created_at)}</span></div>
      </div>
      <div class="task-actions">
        <button class="btn btn-soft" type="button" data-action="next">${n.label}</button>
        <button class="btn btn-ghost" type="button" data-action="edit">Modifier</button>
        <button class="btn btn-danger" type="button" data-action="delete">Supprimer</button>
      </div>
    </article>`;
  }

  function emptyHtml() {
    if (state.tasks.length === 0) {
      return `<div class="empty"><div class="big">📝</div><h3>Aucune tâche pour le moment</h3>
        <p>Ajoutez votre première tâche pour commencer à vous organiser.</p>
        <button class="btn btn-primary" type="button" data-action="add">＋ Ajouter une tâche</button></div>`;
    }
    const msg = state.view === "done" ? "Aucune tâche terminée pour l'instant." : "Aucune tâche ne correspond à ce filtre.";
    return `<div class="empty"><div class="big">🔍</div><h3>${msg}</h3></div>`;
  }

  function render() {
    const count = (s) => state.tasks.filter((t) => t.status === s).length;
    $("stat-total").textContent = state.tasks.length;
    $("stat-pending").textContent = count("pending");
    $("stat-progress").textContent = count("in_progress");
    $("stat-done").textContent = count("completed");

    document.body.dataset.view = state.view;
    $("list-title").textContent = VIEW_TITLES[state.view];
    document.querySelectorAll(".chip").forEach((b) => b.classList.toggle("active", b.dataset.filter === state.filter));
    document.querySelectorAll(".nav-link[data-view]").forEach((a) => a.classList.toggle("active", a.dataset.view === state.view));

    const items = visibleTasks();
    list.innerHTML = items.length ? items.map(cardHtml).join("") : emptyHtml();
  }

  async function load() {
    try {
      state.tasks = await API.getTasks();
      render();
    } catch (err) {
      UI.toast(err.message, "error");
    }
  }

  function openModal(task) {
    state.editingId = task ? task.id : null;
    UI.clearErrors(form);
    $("dialog-title").textContent = task ? "Modifier la tâche" : "Nouvelle tâche";
    form.elements.title.value = task ? task.title : "";
    form.elements.description.value = task ? task.description : "";
    form.elements.status.value = task ? task.status : "pending";
    dialog.showModal();
    form.elements.title.focus();
  }

  // Actions sur la liste (délégation d'événements)
  list.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "add") return openModal(null);
    const id = Number(btn.closest(".task")?.dataset.id);
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      if (action === "edit") return openModal(task);
      if (action === "next") {
        await API.updateTask(id, { status: NEXT[task.status].to });
        UI.toast("Statut mis à jour.");
      }
      if (action === "delete") {
        if (!confirm(`Supprimer la tâche « ${task.title} » ? Cette action est définitive.`)) return;
        await API.deleteTask(id);
        UI.toast("Tâche supprimée.");
      }
      await load();
    } catch (err) {
      UI.toast(err.message, "error");
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    UI.clearErrors(form);
    const d = UI.formData(form);
    if (!d.title) return UI.setError(form, "title", "Donnez un titre à votre tâche.");
    if (d.title.length > 255) return UI.setError(form, "title", "Le titre ne doit pas dépasser 255 caractères.");
    try {
      if (state.editingId) await API.updateTask(state.editingId, d);
      else await API.createTask(d);
      dialog.close();
      UI.toast(state.editingId ? "Tâche modifiée." : "Tâche ajoutée.");
      await load();
    } catch (err) {
      UI.toast(err.message, "error");
    }
  });

  $("add-btn").addEventListener("click", () => openModal(null));
  $("cancel-btn").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // clic sur le fond

  $("chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.filter = chip.dataset.filter;
    render();
  });

  document.querySelectorAll(".nav-link[data-view]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      state.view = a.dataset.view;
      render();
    })
  );

  load();
})();