"""
WSGI config for snapflow project - Production Ready
"""

import sys
import os
import logging
from pathlib import Path

# Configure logging to stderr for Apache
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Get the absolute path to this file's directory
# This file is at: /var/www/snapflow-api.medianet.space/snapflow/snapflow/wsgi.py
current_dir = os.path.dirname(__file__)

# Get the project root (parent of current directory)
# Project root is: /var/www/snapflow-api.medianet.space/snapflow
project_root = os.path.dirname(current_dir)

# Add the project root to Python path if not already there
if project_root not in sys.path:
    sys.path.insert(0, project_root) #
    logger.info(f"Added to Python path: {project_root}")

# Optional: Load .env file for production environment variables
try:
    from dotenv import load_dotenv
    env_path = os.path.join(project_root, '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        logger.info(f"Loaded environment from: {env_path}")
except ImportError:
    logger.info("python-dotenv not installed, using system environment variables")

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snapflow.settings')

# Log the Python path for debugging
logger.info(f"Python path: {sys.path}")
logger.info(f"Current directory: {current_dir}")
logger.info(f"Project root: {project_root}")

try:
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
    logger.info("Django WSGI application initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Django WSGI application: {e}")
    raise

# For development testing
if __name__ == "__main__":
    logger.warning("This WSGI module should be run by Apache/mod_wsgi, not directly")
    print("WSGI application loaded successfully")
    print(f"Project root: {project_root}")
    print(f"Python path: {sys.path}")