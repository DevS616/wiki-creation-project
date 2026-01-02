-- Создаем таблицу связей между статьями и категориями
CREATE TABLE IF NOT EXISTS article_categories (
    article_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (article_id, category_id)
);

-- Переносим существующие связи из articles.category_id в article_categories
INSERT INTO article_categories (article_id, category_id)
SELECT id, category_id 
FROM articles 
WHERE category_id IS NOT NULL;

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_article_categories_article ON article_categories(article_id);
CREATE INDEX IF NOT EXISTS idx_article_categories_category ON article_categories(category_id);