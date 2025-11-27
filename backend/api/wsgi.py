"""
This WSGI file is no longer used for Vercel deployment.
Refer to backend/ashtray_project/wsgi.py instead.
"""

import os

print("WARNING: backend/api/wsgi.py is being loaded but should not be!")

# It's good practice to ensure DJANGO_SETTINGS_MODULE is set if this file *were* used.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ashtray_project.settings')

# Define a dummy application to avoid errors if this is somehow still called.
def application(environ, start_response):
    status = '500 Internal Server Error'
    headers = [('Content-type', 'text/plain')]
    start_response(status, headers)
    return [b"Error: backend/api/wsgi.py should not be used for Vercel WSGI handling."]

# Define a dummy handler as well, just in case.
handler = application 