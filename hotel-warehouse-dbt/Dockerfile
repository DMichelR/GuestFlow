FROM ghcr.io/dbt-labs/dbt-core:1.7.5

# Install ClickHouse adapter
RUN pip install dbt-clickhouse==1.7.2

# Set working directory
WORKDIR /usr/app

# Copy entrypoint script
COPY setup.sh /usr/app/setup.sh
RUN chmod +x /usr/app/setup.sh
