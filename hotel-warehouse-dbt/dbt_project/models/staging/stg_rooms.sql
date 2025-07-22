{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'id') as room_id,
    JSONExtractString(_airbyte_data, 'room_number') as room_number,
    JSONExtractString(_airbyte_data, 'room_type_id') as room_type_id,
    JSONExtractFloat(_airbyte_data, 'price') as price,
    JSONExtractString(_airbyte_data, 'status') as status,
    JSONExtractString(_airbyte_data, 'created_at') as created_at,
    JSONExtractString(_airbyte_data, 'updated_at') as updated_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_Rooms') }}
