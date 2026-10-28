-- One row per person per agent. The unique constraint is the whole anti-abuse
-- story: a GitHub account can register a single vote for an agent, ever.
CREATE TABLE IF NOT EXISTS votes (
  agent_id   TEXT NOT NULL,
  github_id  INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (agent_id, github_id)
);
CREATE INDEX IF NOT EXISTS votes_by_agent ON votes (agent_id);
