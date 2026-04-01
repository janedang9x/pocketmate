-- Per-user hiding of shared default categories (fork-on-edit / delete without mutating global seed rows)
CREATE TABLE user_hidden_default_categories (
  user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  category_kind TEXT NOT NULL CHECK (category_kind IN ('expense', 'income')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, category_id, category_kind)
);

CREATE INDEX idx_user_hidden_default_categories_user_kind
  ON user_hidden_default_categories(user_id, category_kind);

ALTER TABLE user_hidden_default_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_hidden_default_categories_select ON user_hidden_default_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_hidden_default_categories_insert ON user_hidden_default_categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_hidden_default_categories_delete ON user_hidden_default_categories
  FOR DELETE USING (user_id = auth.uid());
