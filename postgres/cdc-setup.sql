-- Change Data Capture (CDC) Setup for GuestFlow
-- This script creates triggers and functions to capture changes in real-time

-- Create CDC schema
CREATE SCHEMA IF NOT EXISTS cdc_guestflow;

-- Create change log table
CREATE TABLE IF NOT EXISTS cdc_guestflow.change_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation CHAR(1) NOT NULL CHECK (operation IN ('I', 'U', 'D')), -- Insert, Update, Delete
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    tenant_id UUID,
    INDEX (table_name, changed_at),
    INDEX (processed, changed_at),
    INDEX (tenant_id, changed_at)
);

-- Create function to log changes
CREATE OR REPLACE FUNCTION cdc_guestflow.log_change()
RETURNS TRIGGER AS $$
DECLARE
    table_name_var VARCHAR(100);
    tenant_id_var UUID;
BEGIN
    table_name_var := TG_TABLE_NAME;
    
    -- Extract tenant_id if available
    IF TG_OP = 'DELETE' THEN
        tenant_id_var := (OLD.tenant_id)::UUID;
    ELSE
        tenant_id_var := (NEW.tenant_id)::UUID;
    END IF;
    
    -- Log the change
    IF TG_OP = 'INSERT' THEN
        INSERT INTO cdc_guestflow.change_log (table_name, operation, record_id, new_data, tenant_id)
        VALUES (table_name_var, 'I', NEW.id, row_to_json(NEW), tenant_id_var);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO cdc_guestflow.change_log (table_name, operation, record_id, old_data, new_data, tenant_id)
        VALUES (table_name_var, 'U', NEW.id, row_to_json(OLD), row_to_json(NEW), tenant_id_var);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO cdc_guestflow.change_log (table_name, operation, record_id, old_data, tenant_id)
        VALUES (table_name_var, 'D', OLD.id, row_to_json(OLD), tenant_id_var);
    END IF;
    
    -- Notify the ETL process
    PERFORM pg_notify('guestflow_changes', 
        json_build_object(
            'table', table_name_var,
            'operation', TG_OP,
            'id', CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END
        )::text
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for main tables
CREATE TRIGGER guests_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Guests"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER rooms_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Rooms"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER stays_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Stays"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER service_tickets_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "ServiceTickets"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER companies_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Companies"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER services_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Services"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER visit_reasons_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "VisitReasons"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

CREATE TRIGGER users_cdc_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION cdc_guestflow.log_change();

-- Create cleanup function for old CDC logs
CREATE OR REPLACE FUNCTION cdc_guestflow.cleanup_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cdc_guestflow.change_log 
    WHERE processed = TRUE 
    AND processed_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_change_log_table_time ON cdc_guestflow.change_log(table_name, changed_at);
CREATE INDEX IF NOT EXISTS idx_change_log_processed ON cdc_guestflow.change_log(processed, changed_at);
CREATE INDEX IF NOT EXISTS idx_change_log_tenant ON cdc_guestflow.change_log(tenant_id, changed_at);

-- Grant permissions
GRANT USAGE ON SCHEMA cdc_guestflow TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cdc_guestflow TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cdc_guestflow TO postgres;
