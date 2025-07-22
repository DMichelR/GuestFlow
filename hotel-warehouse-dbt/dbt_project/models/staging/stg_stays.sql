{{ config(materialized='view') }}

SELECT 
    JSONExtractString(_airbyte_data, 'id') as stay_id,
    JSONExtractFloat(_airbyte_data, 'finalPrice') as final_price,
    JSONExtractUInt(_airbyte_data, 'pax') as pax,
    dateDiff('day', 
        parseDateTime64BestEffort(JSONExtractString(_airbyte_data, 'arrivalDate')), 
        parseDateTime64BestEffort(JSONExtractString(_airbyte_data, 'departureDate'))
    ) as nights,
    -- These will be calculated in the fact table
    0 as rooms_count,
    0 as services_count,
    JSONExtractString(_airbyte_data, 'tenantId') as tenant_id,
    JSONExtractString(_airbyte_data, 'holderId') as guest_id,
    JSONExtractString(_airbyte_data, 'companyId') as company_id,
    JSONExtractString(_airbyte_data, 'visitReasonId') as visit_reason_id,
    JSONExtractString(_airbyte_data, 'arrivalDate') as arrival_date,
    JSONExtractString(_airbyte_data, 'departureDate') as departure_date,
    JSONExtractString(_airbyte_data, 'reservationDate') as reservation_date,
    JSONExtractString(_airbyte_data, 'created') as created_at,
    JSONExtractString(_airbyte_data, 'updated') as updated_at,
    _airbyte_extracted_at,
    _airbyte_loaded_at
FROM {{ source('airbyte_raw', 'default_raw__stream_Stays') }}
