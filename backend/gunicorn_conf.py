import multiprocessing
import os

# Gunicorn configuration file for Azure App Service (Linux)
# FastAPI runs behind Gunicorn with Uvicorn workers

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = int(os.getenv("WEB_CONCURRENCY", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
loglevel = "info"
accesslog = "-"
errorlog = "-"
timeout = 120
keepalive = 5
