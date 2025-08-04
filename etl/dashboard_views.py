"""
Define vistas optimizadas para dashboards en Metabase.
Estas vistas están diseñadas para facilitar la creación de dashboards de análisis.
"""

# Vistas para dashboards en Metabase
DASHBOARD_VIEWS = {
    # Vista para dashboard de ocupación
    "dashboard_occupancy": {
        "query": """
        CREATE VIEW IF NOT EXISTS dashboard_occupancy AS
        SELECT 
            toDate(gr.check_in) as date,
            t.tenant_name,
            r.room_number,
            rt.type_name as room_type,
            rt.capacity,
            s.pax as guests,
            round((s.pax / rt.capacity) * 100, 2) as occupancy_rate,
            gr.occupation_days,
            s.state_text as stay_status,
            vr.reason_name as visit_reason,
            c.company_name
        FROM group_rooms gr
        JOIN room r ON gr.room_id = r.id
        JOIN room_type rt ON r.room_type_id = rt.id
        JOIN stay s ON gr.stay_id = s.id
        JOIN tenant t ON r.tenant_id = t.id
        LEFT JOIN visit_reason vr ON s.visit_reason_id = vr.id
        LEFT JOIN company c ON s.company_id = c.id
        WHERE gr.check_in IS NOT NULL
        ORDER BY date DESC
        """
    },
    
    # Vista para dashboard de ingresos
    "dashboard_revenue": {
        "query": """
        CREATE VIEW IF NOT EXISTS dashboard_revenue AS
        SELECT
            toDate(s.created) as date,
            t.tenant_name,
            'Estancia' as revenue_type,
            s.final_price as amount,
            s.state_text as status,
            vr.reason_name as category,
            g.full_name as guest_name,
            c.company_name,
            s.stay_duration_days as duration,
            s.pax as guest_count
        FROM stay s
        JOIN tenant t ON s.tenant_id = t.id
        LEFT JOIN visit_reason vr ON s.visit_reason_id = vr.id
        LEFT JOIN guest g ON s.holder_id = g.id
        LEFT JOIN company c ON s.company_id = c.id
        
        UNION ALL
        
        SELECT
            toDate(st.created) as date,
            t.tenant_name,
            'Servicio' as revenue_type,
            st.price as amount,
            'Completado' as status,
            srv.service_name as category,
            g.full_name as guest_name,
            c.company_name,
            1 as duration,
            1 as guest_count
        FROM service_ticket st
        JOIN tenant t ON st.tenant_id = t.id
        JOIN service srv ON st.service_id = srv.id
        JOIN stay s ON st.stay_id = s.id
        LEFT JOIN guest g ON s.holder_id = g.id
        LEFT JOIN company c ON s.company_id = c.id
        """
    },
    
    # Vista para dashboard de huéspedes
    "dashboard_guests": {
        "query": """
        CREATE VIEW IF NOT EXISTS dashboard_guests AS
        SELECT
            g.id as guest_id,
            g.full_name,
            g.age,
            g.email,
            g.phone,
            c.city_name,
            co.country_name,
            p.profession_name,
            t.tenant_name,
            count(s.id) as total_stays,
            min(s.arrival_date) as first_stay,
            max(s.arrival_date) as last_stay,
            sum(s.stay_duration_days) as total_days,
            sum(s.final_price) as total_spent,
            max(vr.reason_name) as last_visit_reason
        FROM guest g
        JOIN city c ON g.city_id = c.id
        JOIN country co ON g.country_id = co.id
        LEFT JOIN profession p ON g.profession_id = p.id
        JOIN tenant t ON g.tenant_id = t.id
        LEFT JOIN group_guests gg ON gg.guest_id = g.id
        LEFT JOIN stay s ON gg.stay_id = s.id
        LEFT JOIN visit_reason vr ON s.visit_reason_id = vr.id
        GROUP BY
            g.id, g.full_name, g.age, g.email, g.phone,
            c.city_name, co.country_name, p.profession_name, t.tenant_name
        """
    },
    
    # Vista para dashboard de servicios
    "dashboard_services": {
        "query": """
        CREATE VIEW IF NOT EXISTS dashboard_services AS
        SELECT
            toDate(st.created) as date,
            st.created as datetime,
            t.tenant_name,
            s.service_name,
            st.price,
            g.full_name as guest_name,
            u.user_name as created_by,
            st.notes,
            stay.arrival_date,
            stay.departure_date,
            c.company_name
        FROM service_ticket st
        JOIN service s ON st.service_id = s.id
        JOIN tenant t ON st.tenant_id = t.id
        JOIN user u ON st.user_id = u.id
        JOIN stay ON st.stay_id = stay.id
        LEFT JOIN guest g ON stay.holder_id = g.id
        LEFT JOIN company c ON stay.company_id = c.id
        ORDER BY st.created DESC
        """
    }
}

def get_dashboard_view(view_name):
    """Get a dashboard view definition"""
    if view_name in DASHBOARD_VIEWS:
        return DASHBOARD_VIEWS[view_name]['query']
    return None

def get_all_dashboard_views():
    """Get all dashboard view definitions"""
    return DASHBOARD_VIEWS
