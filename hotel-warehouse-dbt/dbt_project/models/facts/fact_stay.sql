{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='StayKey'
) }}

SELECT 
    cityHash64(s.stay_id) as StayKey,
    s.final_price as FinalPrice,
    s.pax as Pax,
    s.nights as Nights,
    COALESCE(room_counts.rooms_count, 0) as RoomsCount,
    COALESCE(service_counts.services_count, 0) as ServicesCount,
    
    -- Foreign Keys
    cityHash64(s.tenant_id) as TenantKey,
    dg.GuestKey,
    cityHash64(COALESCE(s.company_id, '00000000-0000-0000-0000-000000000000')) as CompanyKey,
    cityHash64(s.visit_reason_id) as VisitReasonKey,
    
    -- Date Keys
    toDate(s.arrival_date) as ArrivalDateKey,
    toDate(s.departure_date) as DepartureDateKey,
    toDate(s.reservation_date) as ReservationDateKey
    
FROM {{ ref('stg_stays') }} s
LEFT JOIN {{ ref('dim_guest') }} dg 
    ON cityHash64(s.guest_id) = cityHash64(splitByChar('-', dg.GuestKey)[1])
    AND dg.CurrentFlag = 1
LEFT JOIN (
    SELECT stay_id, count(*) as rooms_count
    FROM {{ ref('stg_group_rooms') }}
    GROUP BY stay_id
) room_counts ON s.stay_id = room_counts.stay_id
LEFT JOIN (
    SELECT stay_id, count(*) as services_count
    FROM {{ ref('stg_service_tickets') }}
    GROUP BY stay_id
) service_counts ON s.stay_id = service_counts.stay_id
