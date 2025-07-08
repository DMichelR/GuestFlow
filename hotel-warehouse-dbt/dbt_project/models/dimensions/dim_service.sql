{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='ServiceKey'
) }}

SELECT 
    cityHash64(service_id) as ServiceKey,
    name as Name,
    description as Description
FROM {{ ref('stg_services') }}
