ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_clients_user_id ON clients(user_id);
