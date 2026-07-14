CREATE TABLE IF NOT EXISTS article_drafts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    article_id INTEGER NULL REFERENCES articles(id),
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    preview_image TEXT NULL,
    category_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, article_id)
);