{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='ServiceTicketKey'
) }}

SELECT 
    cityHash64(st.service_ticket_id) as ServiceTicketKey,
    st.service_price as ServicePrice,
    st.quantity as Quantity,
    
    -- Foreign Keys
    cityHash64(st.tenant_id) as TenantKey,
    cityHash64(st.stay_id) as StayKey,
    cityHash64(st.service_id) as ServiceKey,
    cityHash64(st.user_id) as UserKey,
    
    -- Date Key
    toDate(st.created_at) as CreatedDateKey
    
FROM {{ ref('stg_service_tickets') }} st
