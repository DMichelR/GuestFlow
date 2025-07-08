{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'id') as guest_id,
    JSONExtractString(_airbyte_data, 'cid') as cid,
    concat(JSONExtractString(_airbyte_data, 'name'), ' ', JSONExtractString(_airbyte_data, 'lastName')) as full_name,
    dateDiff('year', parseDateTime64BestEffort(JSONExtractString(_airbyte_data, 'birthday')), now()) as age,
    JSONExtractString(_airbyte_data, 'profession_id') as profession_id,
    JSONExtractString(_airbyte_data, 'city_id') as city_id,
    JSONExtractString(_airbyte_data, 'country_id') as country_id,
    JSONExtractString(_airbyte_data, 'created_at') as created_at,
    JSONExtractString(_airbyte_data, 'updated_at') as updated_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_Guests') }}
