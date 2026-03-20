CREATE TABLE t_p66622201_wiki_creation_projec.hosted_images (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    filename TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    uploaded_by INTEGER REFERENCES t_p66622201_wiki_creation_projec.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);