FROM python:3.10-slim

WORKDIR /app

# Install build essential dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

EXPOSE 5000

# Start Gunicorn server
CMD ["gunicorn", "app:app", "--workers", "2", "--bind", "0.0.0.0:5000", "--timeout", "120"]
