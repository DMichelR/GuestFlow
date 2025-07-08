{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='VisitReasonKey'
) }}

SELECT 
    cityHash64(visit_reason_id) as VisitReasonKey,
    name as Name
FROM {{ ref('stg_visit_reasons') }}
