{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='UserKey'
) }}

SELECT 
    cityHash64(user_id) as UserKey,
    full_name as FullName,
    role as Role
FROM {{ ref('stg_users') }}
