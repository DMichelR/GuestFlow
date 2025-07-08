WITH
  fechas_periodo AS (
    SELECT 
      fecha,
      CASE 
        WHEN {{period_type}}::INTEGER IN (0, 1) THEN DATE_TRUNC('month', fecha)
        ELSE DATE_TRUNC('week', fecha)
      END AS periodo
    FROM generate_series(
      CASE 
        WHEN {{period_type}}::INTEGER = 0 THEN DATE_TRUNC('year', CURRENT_DATE)
        WHEN {{period_type}}::INTEGER = 1 THEN DATE_TRUNC('year', CURRENT_DATE - INTERVAL '1 year')
        WHEN {{period_type}}::INTEGER = 2 THEN DATE_TRUNC('quarter', CURRENT_DATE)
        WHEN {{period_type}}::INTEGER = 3 THEN DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
      END,
      CASE 
        WHEN {{period_type}}::INTEGER = 0 THEN CURRENT_DATE
        WHEN {{period_type}}::INTEGER = 1 THEN DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 day'
        WHEN {{period_type}}::INTEGER = 2 THEN CURRENT_DATE
        WHEN {{period_type}}::INTEGER = 3 THEN DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '1 day'
      END,
      '1 day'::interval
    ) fecha
  ),
  ocupacion_diaria AS (
    SELECT
      fp.periodo,
      fp.fecha,
      COUNT(DISTINCT gr."RoomId") AS habitaciones_ocupadas_dia
    FROM
      fechas_periodo fp
      LEFT JOIN "GroupRooms" gr ON EXISTS (
        SELECT 1
        FROM "Stays" s
        WHERE 
          s."Id" = gr."StayId"
          AND s."TenantId" = {{tenant_id}}::UUID
          AND s."State" IN ('active', 'completed')
          AND DATE(fp.fecha) BETWEEN DATE(s."ArrivalDate") AND DATE(s."DepartureDate")
      )
    GROUP BY fp.periodo, fp.fecha
  ),
  ocupacion_promedio AS (
    SELECT
      periodo,
      ROUND(AVG(habitaciones_ocupadas_dia), 1) AS promedio_habitaciones_ocupadas,
      COUNT(fecha) AS dias_en_periodo
    FROM ocupacion_diaria
    GROUP BY periodo
  ),
  adr_datos AS (
    SELECT 
      fp.periodo,
      SUM(s."FinalPrice"::numeric) AS total_revenue,
      COUNT(DISTINCT gr."RoomId") AS room_nights
    FROM 
      fechas_periodo fp
      INNER JOIN "Stays" s ON (
        CASE 
          WHEN {{period_type}}::INTEGER IN (0, 1) THEN DATE_TRUNC('month', s."ArrivalDate")
          ELSE DATE_TRUNC('week', s."ArrivalDate")
        END = fp.periodo
      )
      INNER JOIN "GroupRooms" gr ON s."Id" = gr."StayId"
    WHERE 
      s."IsActive" = true 
      AND gr."IsActive" = true
      AND s."State" NOT IN ('canceled', 'pending')
      AND s."TenantId" = {{tenant_id}}::UUID
    GROUP BY fp.periodo
  ),
  total_habitaciones AS (
    SELECT COUNT(*) AS total_rooms
    FROM "Rooms"
    WHERE "TenantId" = {{tenant_id}}::UUID
  )

SELECT 
  op.periodo,
  CASE 
    WHEN {{period_type}}::INTEGER IN (0, 1) THEN TO_CHAR(op.periodo, 'YYYY-MM')
    ELSE TO_CHAR(op.periodo, 'YYYY "Semana" WW')
  END AS periodo_nombre,
  ROUND(
    (op.promedio_habitaciones_ocupadas * 100.0) / th.total_rooms,
    2
  ) AS tasa_ocupacion_promedio,
  ROUND(
    ad.total_revenue / NULLIF(ad.room_nights, 0), 
    2
  ) AS ADR,
  ROUND(
    ((op.promedio_habitaciones_ocupadas * 100.0) / th.total_rooms) * 
    (ad.total_revenue / NULLIF(ad.room_nights, 0)) / 100,
    2
  ) AS RevPAR,
  op.promedio_habitaciones_ocupadas,
  op.dias_en_periodo,
  ad.total_revenue,
  ad.room_nights,
  th.total_rooms AS total_habitaciones_disponibles
FROM
  ocupacion_promedio op
  LEFT JOIN adr_datos ad ON op.periodo = ad.periodo
  CROSS JOIN total_habitaciones th
ORDER BY
  op.periodo;
