{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'id') as user_id,
    concat(JSONExtractString(_airbyte_data, 'firstName'), ' ', JSONExtractString(_airbyte_data, 'lastName')) as full_name,
    JSONExtractString(_airbyte_data, 'accessLevel') as role,
    JSONExtractString(_airbyte_data, 'created_at') as created_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_Users') }}
