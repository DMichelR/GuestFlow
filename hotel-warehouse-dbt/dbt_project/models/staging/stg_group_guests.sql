{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'stay_id') as stay_id,
    JSONExtractString(_airbyte_data, 'guest_id') as guest_id,
    JSONExtractString(_airbyte_data, 'role') as role,
    JSONExtractString(_airbyte_data, 'created_at') as created_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_GroupGuests') }}
