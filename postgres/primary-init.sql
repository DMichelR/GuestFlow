-- Crear usuario de replicación
CREATE USER replicator WITH PASSWORD 'replicator_password' REPLICATION;

-- Crear publicación para todas las tablas
CREATE PUBLICATION guestflow_pub FOR ALL TABLES;

-- Permisos para el esquema público
GRANT USAGE ON SCHEMA public TO replicator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO replicator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO replicator;

-- Configuración adicional para replicación lógica
ALTER SYSTEM SET wal_level = logical;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET max_replication_slots = 10;