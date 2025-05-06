#!/bin/bash
set -e


export PGPASSWORD=$REPLICATOR_PASSWORD

echo "🎯 Haciendo dump del esquema..."
pg_dump --schema-only -h $PRIMARY_HOST -U $REPLICATOR_USER -d $DB_NAME > /tmp/schema.sql
echo "✔️  Dump del esquema completado."


export PGPASSWORD=$POSTGRES_PASSWORD

# Verificar si la réplica ya tiene tablas
TABLE_COUNT=$(psql -h $REPLICA_HOST -p 5433 -U postgres -d $DB_NAME -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "📄 Aplicando esquema a la réplica..."
  psql -h $REPLICA_HOST -p 5433 -U postgres -d $DB_NAME -f /tmp/schema.sql
  echo "✔️  Esquema aplicado."
else
  echo "ℹ️  La réplica ya contiene tablas. Omitiendo aplicación del esquema."
fi

echo "🧑‍🔧 Creando rol replicator en la réplica (si no existe)..."
psql -h $REPLICA_HOST -U $POSTGRES_USER -d $DB_NAME -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'replicator') THEN
    CREATE ROLE replicator WITH LOGIN PASSWORD '$REPLICATOR_PASSWORD';
  END IF;
END \$\$;"

echo "🕒 Esperando a que la réplica esté completamente lista..."
until pg_isready -h $REPLICA_HOST -p 5433 -U postgres; do
  sleep 2
done

echo "🔍 Verificando si ya existe la suscripción..."
SUB_EXISTS=$(psql -h $REPLICA_HOST -p 5433 -U postgres -d $DB_NAME -tAc "SELECT 1 FROM pg_subscription WHERE subname = 'guestflow_sub'")

if [ "$SUB_EXISTS" != "1" ]; then
  echo "🚀 Creando suscripción..."
  psql -h $REPLICA_HOST -p 5433 -U postgres -d $DB_NAME <<-EOSQL
    CREATE SUBSCRIPTION guestflow_sub
    CONNECTION 'host=$PRIMARY_HOST port=5432 dbname=$DB_NAME user=$REPLICATOR_USER password=$REPLICATOR_PASSWORD'
    PUBLICATION guestflow_pub
    WITH (
      copy_data = true,
      create_slot = true,
      enabled = true,
      slot_name = 'guestflow_slot',
      connect = true
    );
EOSQL
  echo "✅ Suscripción creada exitosamente!"
else
  echo "ℹ️ La suscripción ya existe, omitiendo creación."
fi