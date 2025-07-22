{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'stay_id') as stay_id,
    JSONExtractString(_airbyte_data, 'room_id') as room_id,
    JSONExtractString(_airbyte_data, 'usage_type') as usage_type,
    JSONExtractString(_airbyte_data, 'created_at') as created_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_GroupRooms') }}
