import uuid
from django.conf import settings
from django.http import JsonResponse

class DeviceIDMiddleware:
    """
    Middleware to assign a unique device ID to each visitor.
    This helps track shopping carts for anonymous users.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if device_id cookie exists
        if not request.COOKIES.get('device_id'):
            # Create a unique ID for this device
            device_id = str(uuid.uuid4())
            
            # Process the request
            response = self.get_response(request)
            
            # Set cookie settings based on environment
            secure = True  # True for all environments
            samesite = 'None'  # None for cross-site in production
            
            # Set the device_id cookie
            response.set_cookie(
                'device_id',
                device_id,
                max_age=365 * 24 * 60 * 60,  # 1 year
                httponly=False,  # Allow JavaScript access
                samesite=samesite,
                secure=secure,
                path='/',  # Available across the site
            )
            
            return response
        
        # Process the request normally
        return self.get_response(request)


class APIMiddleware:
    """
    Custom middleware to handle API requests with special CORS headers and preflight.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if this is an API request
        if request.path.startswith('/api/'):
            # Handle OPTIONS requests for preflight checks
            if request.method == 'OPTIONS':
                response = JsonResponse({})
                response['Access-Control-Allow-Origin'] = '*'
                response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type, X-Requested-With, X-CSRFToken, Authorization'
                response['Access-Control-Allow-Credentials'] = 'true'
                return response
            
            # Process the request
            response = self.get_response(request)
            
            # Add CORS headers to the response
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, X-Requested-With, X-CSRFToken, Authorization'
            response['Access-Control-Allow-Credentials'] = 'true'
            
            return response
        
        # Not an API request, process normally
        return self.get_response(request) 