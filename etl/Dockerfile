FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Ensure all required dependencies are installed
RUN pip install --no-cache-dir pydantic-settings python-dateutil numpy clickhouse-driver psycopg2-binary pandas

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Make check script executable
RUN chmod +x tools/check_clickhouse.py

# Run the ETL service
CMD ["python", "main.py"]
