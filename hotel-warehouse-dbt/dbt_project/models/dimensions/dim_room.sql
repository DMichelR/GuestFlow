{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='RoomKey'
) }}

WITH room_history AS (
    SELECT 
        r.room_id,
        r.room_number,
        rt.name as room_type,
        rt.price as price,
        r.status,
        r.created_at,
        r.updated_at,
        COALESCE(LEAD(r.updated_at) OVER (PARTITION BY r.room_id ORDER BY r.updated_at), '2099-12-31') as next_update,
        ROW_NUMBER() OVER (PARTITION BY r.room_id ORDER BY r.updated_at DESC) as rn
    FROM {{ ref('stg_rooms') }} r
    LEFT JOIN {{ ref('stg_room_types') }} rt ON r.room_type_id = rt.room_type_id
)

SELECT 
    cityHash64(room_id, toString(created_at)) as RoomKey,
    room_number as RoomNumber,
    room_type as RoomType,
    price as Price,
    status as Status,
    toDate(created_at) as EffectiveDate,
    toDate(next_update) as ExpiryDate,
    CASE WHEN rn = 1 THEN 1 ELSE 0 END as CurrentFlag
FROM room_history
