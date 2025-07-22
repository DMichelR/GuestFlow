{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'id') as room_type_id,
    JSONExtractString(_airbyte_data, 'name') as name,
    JSONExtractString(_airbyte_data, 'created_at') as created_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_RoomTypes') }}
