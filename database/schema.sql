-- =============================================================
-- Task Manager - Schéma PostgreSQL
-- Base de données : task_manager_db
-- Tables : users, tasks
-- =============================================================


-- -------------------------------------------------------------
-- Table : users
-- Comptes utilisateurs de l'application
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(100)             NOT NULL,
    email         VARCHAR(255)             NOT NULL,
    password_hash VARCHAR(255)             NOT NULL,  -- hash (ex. bcrypt), jamais le mot de passe en clair
    created_at    TIMESTAMPTZ              NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique     UNIQUE (email),
    CONSTRAINT users_name_not_blank   CHECK (length(trim(name)) > 0),
    CONSTRAINT users_email_not_blank  CHECK (length(trim(email)) > 0)
);


-- -------------------------------------------------------------
-- Table : tasks
-- Tâches appartenant chacune à un seul utilisateur
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     INTEGER                  NOT NULL,
    title       VARCHAR(255)             NOT NULL,
    description TEXT,                                  -- facultatif
    status      VARCHAR(20)              NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ              NOT NULL DEFAULT NOW(),

    -- Suppression d'un utilisateur => suppression de ses tâches
    CONSTRAINT tasks_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    -- Valeurs de statut autorisées
    CONSTRAINT tasks_status_check
        CHECK (status IN ('pending', 'in_progress', 'completed')),

    CONSTRAINT tasks_title_not_blank
        CHECK (length(trim(title)) > 0)
);


-- -------------------------------------------------------------
-- Index
-- Accélère la recherche des tâches d'un utilisateur
-- (l'unicité de users.email est déjà indexée par la contrainte UNIQUE)
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);