/**
 * api.js – Couche d'accès aux données (MODE DÉMONSTRATION).
 *
 * Tout le reste du front-end passe uniquement par l'objet `API`.
 * Pour brancher le vrai back-end, il suffit de réécrire le corps de ces
 * fonctions avec fetch() en gardant les mêmes signatures :
 *
 *   register({name,email,password})  -> POST   /api/auth/register
 *   login({email,password})          -> POST   /api/auth/login
 *   logout()                         -> POST   /api/auth/logout   (ou suppression du jeton)
 *   currentUser()                    -> utilisateur issu de la session / du jeton
 *   getTasks()                       -> GET    /api/tasks
 *   createTask({title,description,status}) -> POST   /api/tasks
 *   updateTask(id, champs)           -> PUT    /api/tasks/:id
 *   deleteTask(id)                   -> DELETE /api/tasks/:id
 *
 * ATTENTION : ici les mots de passe sont stockés en clair dans localStorage.
 * C'est uniquement pour la démonstration, ce n'est PAS sécurisé et PostgreSQL n'est pas utilisé.
 * Le vrai hachage (password_hash) et la vraie authentification relèvent du back-end.
 */
const API = (() => {
  const CONFIG = { BASE_URL: "http://localhost:3000/api" }; // à utiliser avec le back-end
  const KEYS = { users: "tm_users", tasks: "tm_tasks", session: "tm_session" };
  const STATUSES = ["pending", "in_progress", "completed"];

  const read = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const wait = (v) => new Promise((r) => setTimeout(() => r(v), 120)); // simule le réseau
  const fail = (msg) => Promise.reject(new Error(msg));
  const nextId = (list) => list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
  const publicUser = (u) => (u ? { id: u.id, name: u.name, email: u.email, created_at: u.created_at } : null);

  function seedTasks(userId) {
    const tasks = read(KEYS.tasks, []);
    const now = Date.now(), day = 86400000;
    const demo = [
      ["Préparer la présentation du projet", "Rassembler les diapositives et répéter l'exposé.", "in_progress", 2],
      ["Envoyer le rapport hebdomadaire", "À envoyer avant vendredi midi.", "pending", 1],
      ["Réviser le cours de bases de données", "", "completed", 4],
    ];
    demo.forEach(([title, description, status, ago], i) => {
      const d = new Date(now - ago * day).toISOString();
      tasks.push({ id: nextId(tasks) + i * 0, user_id: userId, title, description, status, created_at: d, updated_at: d });
    });
    write(KEYS.tasks, tasks);
  }

  // Compte de démonstration créé au premier chargement
  if (read(KEYS.users, []).length === 0) {
    const demo = { id: 1, name: "Utilisateur Démo", email: "demo@taskmanager.com", password: "demo1234", created_at: new Date().toISOString() };
    write(KEYS.users, [demo]);
    seedTasks(demo.id);
  }

  const sessionUserId = () => read(KEYS.session, null);
  const requireUser = () => {
    const id = sessionUserId();
    if (!id) throw new Error("Session expirée. Veuillez vous reconnecter.");
    return id;
  };

  return {
    CONFIG,
    STATUSES,

    currentUser() {
      const id = sessionUserId();
      return publicUser(read(KEYS.users, []).find((u) => u.id === id));
    },

    async register({ name, email, password }) {
      const users = read(KEYS.users, []);
      email = email.trim().toLowerCase();
      if (users.some((u) => u.email === email)) return fail("Cette adresse e-mail est déjà utilisée.");
      const user = { id: nextId(users), name: name.trim(), email, password, created_at: new Date().toISOString() };
      users.push(user);
      write(KEYS.users, users);
      write(KEYS.session, user.id);
      return wait(publicUser(user));
    },

    async login({ email, password }) {
      const user = read(KEYS.users, []).find((u) => u.email === email.trim().toLowerCase() && u.password === password);
      if (!user) return fail("E-mail ou mot de passe incorrect.");
      write(KEYS.session, user.id);
      return wait(publicUser(user));
    },

    logout() { localStorage.removeItem(KEYS.session); },

    async getTasks() {
      const uid = requireUser();
      return wait(read(KEYS.tasks, []).filter((t) => t.user_id === uid));
    },

    async createTask({ title, description = "", status = "pending" }) {
      const uid = requireUser();
      if (!title || !title.trim()) return fail("Le titre est obligatoire.");
      if (!STATUSES.includes(status)) return fail("Statut invalide.");
      const tasks = read(KEYS.tasks, []);
      const now = new Date().toISOString();
      const task = { id: nextId(tasks), user_id: uid, title: title.trim(), description: description.trim(), status, created_at: now, updated_at: now };
      tasks.push(task);
      write(KEYS.tasks, tasks);
      return wait(task);
    },

    async updateTask(id, fields) {
      const uid = requireUser();
      const tasks = read(KEYS.tasks, []);
      const task = tasks.find((t) => t.id === id && t.user_id === uid);
      if (!task) return fail("Tâche introuvable.");
      if (fields.status && !STATUSES.includes(fields.status)) return fail("Statut invalide.");
      if ("title" in fields && !fields.title.trim()) return fail("Le titre est obligatoire.");
      Object.assign(task, fields, { updated_at: new Date().toISOString() });
      if (typeof task.title === "string") task.title = task.title.trim();
      write(KEYS.tasks, tasks);
      return wait(task);
    },

    async deleteTask(id) {
      const uid = requireUser();
      const tasks = read(KEYS.tasks, []);
      if (!tasks.some((t) => t.id === id && t.user_id === uid)) return fail("Tâche introuvable.");
      write(KEYS.tasks, tasks.filter((t) => !(t.id === id && t.user_id === uid)));
      return wait(true);
    },
  };
})();