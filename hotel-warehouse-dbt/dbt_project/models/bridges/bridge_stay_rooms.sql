{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='(StayKey, RoomKey)'
) }}

SELECT 
    cityHash64(gr.stay_id) as StayKey,
    dr.RoomKey,
    COALESCE(gr.usage_type, 'standard') as UsageType
FROM {{ ref('stg_group_rooms') }} gr
LEFT JOIN {{ ref('dim_room') }} dr 
    ON cityHash64(gr.room_id) = cityHash64(splitByChar('-', dr.RoomKey)[1])
    AND dr.CurrentFlag = 1
