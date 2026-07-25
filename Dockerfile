FROM python:3.10-slim

WORKDIR /app

# Environment variables for memory & thread optimization
ENV OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    TOKENIZERS_PARALLELISM=false \
    RENDER=true

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

# Start Gunicorn server with 1 worker and 4 threads (<512MB RAM)
CMD ["gunicorn", "app:app", "--workers", "1", "--threads", "4", "--bind", "0.0.0.0:5000", "--timeout", "120"]
