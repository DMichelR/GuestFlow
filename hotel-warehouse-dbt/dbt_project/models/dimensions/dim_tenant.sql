{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='TenantKey'
) }}

SELECT 
    cityHash64(tenant_id) as TenantKey,
    name as Name
FROM {{ ref('stg_tenants') }}
