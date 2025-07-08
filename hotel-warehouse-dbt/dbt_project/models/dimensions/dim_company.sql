{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='CompanyKey'
) }}

SELECT 
    cityHash64(company_id) as CompanyKey,
    name as Name
FROM {{ ref('stg_companies') }}
