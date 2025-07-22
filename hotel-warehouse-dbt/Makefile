# Makefile para gestionar el proyecto dbt

.PHONY: help setup up down run test clean lint docs update update-fast update-full check-data

help: ## Mostrar ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Configurar el proyecto inicial
	@echo "Configurando proyecto..."
	chmod +x setup.sh
	./setup.sh

up: ## Levantar servicios
	docker-compose up -d
	@echo "Esperando que ClickHouse esté listo..."
	@sleep 10

down: ## Detener servicios
	docker-compose down

run: ## Ejecutar modelos dbt
	docker exec -it dbt bash -c "cd /usr/app && dbt run --target dev"

test: ## Ejecutar tests dbt
	docker exec -it dbt bash -c "cd /usr/app && dbt test --target dev"

clean: ## Limpiar target y logs
	docker exec -it dbt bash -c "cd /usr/app && dbt clean"

lint: ## Validar sintaxis SQL
	docker exec -it dbt bash -c "cd /usr/app && dbt parse"

docs: ## Generar documentación
	docker exec -it dbt bash -c "cd /usr/app && dbt docs generate"
	docker exec -it dbt bash -c "cd /usr/app && dbt docs serve --host 0.0.0.0"

seed: ## Cargar datos de seed
	docker exec -it dbt bash -c "cd /usr/app && dbt seed"

snapshot: ## Ejecutar snapshots
	docker exec -it dbt bash -c "cd /usr/app && dbt snapshot"

run-staging: ## Ejecutar solo modelos staging
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select staging"

run-dimensions: ## Ejecutar solo dimensiones
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select dimensions"

run-facts: ## Ejecutar solo facts
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select facts"

run-bridges: ## Ejecutar solo bridges
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select bridges"

full-refresh: ## Ejecutar con full refresh
	docker exec -it dbt bash -c "cd /usr/app && dbt run --full-refresh"

shell: ## Acceder al contenedor dbt
	docker exec -it dbt bash

logs: ## Ver logs de ClickHouse
	docker logs -f clickhouse

status: ## Ver estado de contenedores
	docker-compose ps

debug: ## Verificar conexión dbt
	docker exec -it dbt bash -c "cd /usr/app && dbt debug --profiles-dir ."

show-models: ## Listar todos los modelos
	docker exec -it dbt bash -c "cd /usr/app && dbt list"

show-sources: ## Listar todas las fuentes
	docker exec -it dbt bash -c "cd /usr/app && dbt list --resource-type source"

clickhouse-shell: ## Acceder a ClickHouse shell
	docker exec -it clickhouse clickhouse-client

show-tables: ## Mostrar tablas en airbyte_internal
	docker exec -it clickhouse clickhouse-client --query "SHOW TABLES FROM airbyte_internal"

show-staging-tables: ## Mostrar tablas creadas en staging
	docker exec -it clickhouse clickhouse-client --query "SHOW TABLES FROM default_staging"

# Comandos de actualización optimizados
update: ## Actualización incremental (staging + dimensions que funcionan)
	@echo "🔄 Actualizando staging..."
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select staging"
	@echo "🔄 Actualizando dimensiones..."
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select dimensions" --warn-error=false
	@echo "✅ Actualización completada"

update-fast: ## Actualización rápida (solo staging)
	@echo "⚡ Actualización rápida de staging..."
	docker exec -it dbt bash -c "cd /usr/app && dbt run --select staging"
	@echo "✅ Staging actualizado"

update-full: ## Actualización completa con recreación
	@echo "🔄 Actualizacion completa del warehouse..."
	docker exec -it dbt bash -c "cd /usr/app && dbt run --full-refresh"
	@echo "✅ Warehouse completamente actualizado"

check-data: ## Verificar datos en staging
	@echo "📊 Verificando datos en staging..."
	docker exec -it clickhouse clickhouse-client --query "SELECT 'Cities', count() FROM default_staging.stg_cities UNION ALL SELECT 'Guests', count() FROM default_staging.stg_guests UNION ALL SELECT 'Stays', count() FROM default_staging.stg_stays"

abcdeg:
	@echo "This is a placeholder for future commands. No action taken."
	docker exec -it dbt bash -c "SELECT _airbyte_data FROM raw__stream_Guests LIMIT 1;"