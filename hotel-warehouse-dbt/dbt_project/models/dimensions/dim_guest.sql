{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='GuestKey'
) }}

WITH guest_history AS (
    SELECT 
        g.guest_id,
        g.cid,
        g.full_name,
        g.age,
        p.name as profession,
        c.name as city,
        co.name as country,
        g.created_at,
        g.updated_at,
        COALESCE(LEAD(g.updated_at) OVER (PARTITION BY g.guest_id ORDER BY g.updated_at), '2099-12-31') as next_update,
        ROW_NUMBER() OVER (PARTITION BY g.guest_id ORDER BY g.updated_at DESC) as rn
    FROM {{ ref('stg_guests') }} g
    LEFT JOIN {{ ref('stg_professions') }} p ON g.profession_id = p.profession_id
    LEFT JOIN {{ ref('stg_cities') }} c ON g.city_id = c.city_id
    LEFT JOIN {{ ref('stg_countries') }} co ON g.country_id = co.country_id
)

SELECT 
    cityHash64(guest_id, toString(created_at)) as GuestKey,
    cid as CID,
    full_name as FullName,
    age as Age,
    profession as Profession,
    city as City,
    country as Country,
    toDate(created_at) as EffectiveDate,
    toDate(next_update) as ExpiryDate,
    CASE WHEN rn = 1 THEN 1 ELSE 0 END as CurrentFlag
FROM guest_history
