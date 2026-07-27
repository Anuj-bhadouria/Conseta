ALTER TABLE clients DROP CONSTRAINT clients_domain_key;
ALTER TABLE clients ADD CONSTRAINT clients_domain_user_unique UNIQUE (domain, user_id);
