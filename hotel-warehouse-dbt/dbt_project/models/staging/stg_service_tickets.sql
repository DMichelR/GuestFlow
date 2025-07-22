{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'id') as service_ticket_id,
    JSONExtractFloat(_airbyte_data, 'price') as service_price,
    1 as quantity, -- Default quantity if not in source
    JSONExtractString(_airbyte_data, 'tenantId') as tenant_id,
    JSONExtractString(_airbyte_data, 'stayId') as stay_id,
    JSONExtractString(_airbyte_data, 'serviceId') as service_id,
    JSONExtractString(_airbyte_data, 'userId') as user_id,
    JSONExtractString(_airbyte_data, 'created') as created_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_ServiceTickets') }}
