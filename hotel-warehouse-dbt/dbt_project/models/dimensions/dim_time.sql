{{ config(
    materialized='table',
    engine='MergeTree()',
    order_by='DateKey'
) }}

WITH date_spine AS (
    SELECT 
        toDate('2020-01-01') + number as date_day
    FROM numbers(365 * 10)  -- 10 years of dates
),

holidays AS (
    -- Add your country-specific holidays here
    SELECT date_day
    FROM (
        VALUES 
            ('2024-01-01'),  -- New Year
            ('2024-12-25'),  -- Christmas
            ('2024-07-04')   -- Example holiday
    ) AS t(date_day)
)

SELECT 
    date_day as DateKey,
    toDayOfMonth(date_day) as Day,
    dateName('month', date_day) as Month,
    toQuarter(date_day) as Quarter,
    toYear(date_day) as Year,
    CASE WHEN toDayOfWeek(date_day) IN (6, 7) THEN 1 ELSE 0 END as IsWeekend,
    CASE WHEN date_day IN (SELECT date_day FROM holidays) THEN 1 ELSE 0 END as IsHoliday
FROM date_spine
ORDER BY date_day
