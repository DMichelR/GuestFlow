"""
Define vistas materializadas para facilitar el análisis en ClickHouse.
Estas vistas proporcionan datos ya transformados y listos para reportes.
"""

# Vistas materializadas para el data warehouse
MATERIALIZED_VIEWS = {
    # Vista materializada para análisis de ocupación
    "mv_room_occupancy": {
        "query": """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_room_occupancy
        ENGINE = MergeTree()
        ORDER BY (date, tenant_id, room_id)
        POPULATE AS
        SELECT 
            gr.room_id,
            r.room_number,
            rt.type_name as room_type,
            rt.capacity,
            toDate(gr.check_in) as date,
            gr.stay_id,
            s.pax,
            s.state as stay_state,
            s.state_text as stay_state_text,
            gr.occupation_days,
            r.tenant_id,
            t.tenant_name
        FROM group_rooms AS gr
        JOIN room AS r ON gr.room_id = r.id
        JOIN room_type AS rt ON r.room_type_id = rt.id
        JOIN stay AS s ON gr.stay_id = s.id
        JOIN tenant AS t ON r.tenant_id = t.id
        WHERE gr.check_in IS NOT NULL
        """
    },
    
    # Vista materializada para análisis de ingresos
    "mv_revenue_analysis": {
        "query": """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_revenue_analysis
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, tenant_id, revenue_type)
        POPULATE AS
        SELECT
            toDate(s.created) as date,
            s.tenant_id,
            t.tenant_name,
            'Stay' as revenue_type,
            count() as transaction_count,
            sum(s.final_price) as total_revenue,
            avg(s.final_price) as avg_revenue,
            s.state as status,
            s.state_text as status_text,
            s.visit_reason_id,
            vr.reason_name as visit_reason,
            s.company_id,
            c.company_name
        FROM stay s
        JOIN tenant t ON s.tenant_id = t.id
        JOIN visit_reason vr ON s.visit_reason_id = vr.id
        LEFT JOIN company c ON s.company_id = c.id
        GROUP BY 
            date, s.tenant_id, t.tenant_name, revenue_type, 
            s.state, s.state_text, s.visit_reason_id, 
            vr.reason_name, s.company_id, c.company_name
        
        UNION ALL
        
        SELECT
            toDate(st.created) as date,
            st.tenant_id,
            t.tenant_name,
            'Service' as revenue_type,
            count() as transaction_count,
            sum(st.price) as total_revenue,
            avg(st.price) as avg_revenue,
            0 as status, 
            '' as status_text,
            NULL as visit_reason_id,
            '' as visit_reason,
            NULL as company_id,
            '' as company_name
        FROM service_ticket st
        JOIN tenant t ON st.tenant_id = t.id
        GROUP BY 
            date, st.tenant_id, t.tenant_name, revenue_type, 
            status, status_text, visit_reason_id, 
            visit_reason, company_id, company_name
        """
    },
    
    # Vista materializada para análisis de huéspedes
    "mv_guest_analysis": {
        "query": """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_guest_analysis
        ENGINE = MergeTree()
        ORDER BY (guest_id, tenant_id)
        POPULATE AS
        SELECT
            g.id as guest_id,
            g.full_name,
            g.age,
            g.city_id,
            c.city_name,
            g.country_id,
            co.country_name,
            g.profession_id,
            p.profession_name,
            g.tenant_id,
            t.tenant_name,
            count(s.id) as total_stays,
            min(s.arrival_date) as first_stay_date,
            max(s.arrival_date) as last_stay_date,
            sum(s.stay_duration_days) as total_days_stayed,
            sum(s.final_price) as total_revenue
        FROM guest g
        JOIN city c ON g.city_id = c.id
        JOIN country co ON g.country_id = co.id
        LEFT JOIN profession p ON g.profession_id = p.id
        JOIN tenant t ON g.tenant_id = t.id
        LEFT JOIN stay s ON s.holder_id = g.id
        GROUP BY
            g.id, g.full_name, g.age, g.city_id, c.city_name,
            g.country_id, co.country_name, g.profession_id,
            p.profession_name, g.tenant_id, t.tenant_name
        """
    },
    
    # Vista materializada para análisis de servicios
    "mv_service_analysis": {
        "query": """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_service_analysis
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, tenant_id, service_id)
        POPULATE AS
        SELECT
            toDate(st.created) as date,
            st.service_id,
            s.service_name,
            st.tenant_id,
            t.tenant_name,
            count() as service_count,
            sum(st.price) as total_revenue,
            avg(st.price) as avg_price,
            min(st.price) as min_price,
            max(st.price) as max_price,
            st.stay_id,
            st.user_id,
            u.user_name as created_by
        FROM service_ticket st
        JOIN service s ON st.service_id = s.id
        JOIN tenant t ON st.tenant_id = t.id
        JOIN user u ON st.user_id = u.id
        GROUP BY
            date, st.service_id, s.service_name, st.tenant_id, 
            t.tenant_name, st.stay_id, st.user_id, u.user_name
        """
    },
    
    # Vista materializada para análisis de tendencia de ingresos diarios
    "mv_daily_revenue_trend": {
        "query": """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue_trend
        ENGINE = SummingMergeTree()
        PARTITION BY toYYYYMM(date)
        ORDER BY (date, tenant_id)
        POPULATE AS
        SELECT
            toDate(s.created) as date,
            s.tenant_id,
            t.tenant_name,
            count() as stay_count,
            sum(s.final_price) as stay_revenue,
            0 as service_count,
            toFloat64(0) as service_revenue
        FROM stay s
        JOIN tenant t ON s.tenant_id = t.id
        GROUP BY date, s.tenant_id, t.tenant_name
        
        UNION ALL
        
        SELECT
            toDate(st.created) as date,
            st.tenant_id,
            t.tenant_name,
            0 as stay_count,
            toFloat64(0) as stay_revenue,
            count() as service_count,
            sum(st.price) as service_revenue
        FROM service_ticket st
        JOIN tenant t ON st.tenant_id = t.id
        GROUP BY date, st.tenant_id, t.tenant_name
        """
    }
}

def get_materialized_view(view_name):
    """Get a materialized view definition"""
    if view_name in MATERIALIZED_VIEWS:
        return MATERIALIZED_VIEWS[view_name]['query']
    return None

def get_all_materialized_views():
    """Get all materialized view definitions"""
    return MATERIALIZED_VIEWS
