const Database = require("better-sqlite3");

const db = new Database("agent.db");

// Enable WAL mode for better concurrent read/write behavior
db.pragma("journal_mode = WAL");

// Enforce foreign-key relationships
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        created_at TEXT NOT NULL,
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        topic TEXT NOT NULL,
        text TEXT NOT NULL,
        rationale TEXT NOT NULL,
        sources TEXT NOT NULL,
        created_at TEXT NOT NULL,

        FOREIGN KEY (agent_id)
        REFERENCES agents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_posts_agent_id
    ON posts(agent_id);

    CREATE INDEX IF NOT EXISTS idx_posts_created_at
    ON posts(created_at);

    CREATE INDEX IF NOT EXISTS idx_posts_agent_topic
    ON posts(agent_id, topic);
`);

console.log("Database initialized successfully");

module.exports = db;