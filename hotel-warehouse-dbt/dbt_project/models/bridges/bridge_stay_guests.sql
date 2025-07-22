{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='(StayKey, GuestKey)'
) }}

SELECT 
    cityHash64(gg.stay_id) as StayKey,
    dg.GuestKey,
    JSONExtractString(gg._airbyte_data, 'role') as Role
FROM {{ ref('stg_group_guests') }} gg
LEFT JOIN {{ ref('dim_guest') }} dg 
    ON cityHash64(JSONExtractString(gg._airbyte_data, 'guest_id')) = cityHash64(splitByChar('-', dg.GuestKey)[1])
    AND dg.CurrentFlag = 1
