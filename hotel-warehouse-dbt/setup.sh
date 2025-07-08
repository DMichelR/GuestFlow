#!/bin/bash

# Script para configurar el proyecto dbt con Docker

echo "Configurando proyecto dbt para transformación de datos Airbyte..."

# Crear estructura de directorios
mkdir -p dbt_project/{models/{staging,intermediate,dimensions,facts,bridges},macros,tests,seeds,snapshots,analyses}
mkdir -p profiles

echo "Estructura de directorios creada."

# Crear archivos de configuración básicos
echo "Creando archivos de configuración..."

# Copiar archivos de configuración (estos deben crearse según los artifacts)
# Los archivos dbt_project.yml y profiles.yml ya están definidos en los artifacts

echo "Configuración completada."

# Instrucciones para el usuario
echo ""
echo "Pasos para ejecutar:"
echo "1. docker-compose up -d"
echo "2. docker exec -it dbt_clickhouse bash"
echo "3. dbt deps"
echo "4. dbt run --target dev"
echo "5. dbt test"
echo ""
echo "Para desarrollo:"
echo "- docker exec -it dbt_clickhouse dbt run --select +modelo_especifico"
echo "- docker exec -it dbt_clickhouse dbt test --select modelo_especifico"
