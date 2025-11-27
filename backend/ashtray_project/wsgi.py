"""
WSGI config for ashtray_project project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys # Restore sys import

# Add the project directory (containing ashtray_project) to the sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ashtray_project.settings')

# Rename 'application' to 'app' for Vercel WSGI compatibility
app = get_wsgi_application() 