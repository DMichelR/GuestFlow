#!/bin/bash
# filepath: /home/mcqueen/Desktop/Code/Proyecto de grado/GuestFlow/postgres/replica-init.sh

PRIMARY_HOST="postgres"
REPLICA_HOST="postgres_replica"
DB_NAME="guestflow"
REPLICATOR_USER="replicator"
REPLICATOR_PASSWORD="replicator_password"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres_password"

export PGPASSWORD=$REPLICATOR_PASSWORD

echo "Esperando a que el host principal ($PRIMARY_HOST) esté listo..."
until pg_isready -h $PRIMARY_HOST -U $REPLICATOR_USER; do
  sleep 2
done
echo "✔️  El host principal está listo."

# Dump del esquema
echo "🎯 Haciendo dump del esquema..."
pg_dump --schema-only -h $PRIMARY_HOST -U $REPLICATOR_USER -d $DB_NAME > /tmp/schema.sql
echo "✔️  Dump del esquema completado."

export PGPASSWORD=$POSTGRES_PASSWORD

# Esperar réplica
echo "Esperando a que el host réplica ($REPLICA_HOST) esté listo..."
RETRY_COUNT=0
MAX_RETRIES=30
until pg_isready -h $REPLICA_HOST -U $POSTGRES_USER || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  sleep 2
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Intento $RETRY_COUNT de $MAX_RETRIES..."
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ El host réplica ($REPLICA_HOST) no está listo después de $MAX_RETRIES intentos."
  exit 1
fi
echo "✔️  El host réplica está listo."

echo "🧑‍🔧 Creando rol replicator en la réplica (si no existe)..."
psql -h $REPLICA_HOST -U $POSTGRES_USER -d $DB_NAME -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'replicator') THEN
    CREATE ROLE replicator WITH LOGIN PASSWORD '$REPLICATOR_PASSWORD';
  END IF;
END \$\$;"


# Verificar si la réplica ya tiene tablas
TABLE_COUNT=$(psql -h $REPLICA_HOST -U $POSTGRES_USER -d $DB_NAME -Atc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "📄 Aplicando esquema a la réplica..."
  psql -h $REPLICA_HOST -U $POSTGRES_USER -d $DB_NAME -f /tmp/schema.sql
  echo "✔️  Esquema aplicado."
else
  echo "ℹ️  La réplica ya contiene tablas. Omitiendo aplicación del esquema."
fi

# Verificar si ya existe la suscripción
SUB_EXISTS=$(psql -h $REPLICA_HOST -U $POSTGRES_USER -d $DB_NAME -Atc "SELECT COUNT(*) FROM pg_subscription WHERE subname = 'guestflow_sub';")

if [ "$SUB_EXISTS" -eq 0 ]; then
  echo "🔗 Creando suscripción..."
  psql -h $REPLICA_HOST -U $POSTGRES_USER -d $DB_NAME -c "
  CREATE SUBSCRIPTION guestflow_sub
  CONNECTION 'host=$PRIMARY_HOST port=5432 dbname=$DB_NAME user=$REPLICATOR_USER password=$REPLICATOR_PASSWORD'
  PUBLICATION guestflow_pub
  WITH (copy_data = true, create_slot = true, enabled = true, connect = true);"
  echo "✔️  Suscripción creada."
else
  echo "ℹ️  La suscripción 'guestflow_sub' ya existe. No se creará nuevamente."
fi
