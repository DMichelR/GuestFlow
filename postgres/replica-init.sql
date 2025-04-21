DO $$
BEGIN
    PERFORM pg_sleep(10);
END $$;

CREATE SUBSCRIPTION guestflow_sub
CONNECTION 'host=postgres port=5432 dbname=guestflow user=replicator password=replicator_password'
PUBLICATION guestflow_pub
WITH (copy_data = true, create_slot = true, enabled = true, connect = true);