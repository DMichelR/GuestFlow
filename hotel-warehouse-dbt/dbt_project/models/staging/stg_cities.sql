{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'Id') as city_id,
    JSONExtractString(_airbyte_data, 'Name') as name,
    JSONExtractString(_airbyte_data, 'Country_id') as country_id,
    JSONExtractString(_airbyte_data, 'Created') as created_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_Cities') }}
