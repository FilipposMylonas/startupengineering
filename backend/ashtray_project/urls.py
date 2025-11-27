from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from api.views import stripe_webhook

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # Stripe webhook - this needs to be a direct path
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 