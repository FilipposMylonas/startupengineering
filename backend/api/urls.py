from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views
from django.views.decorators.csrf import csrf_exempt

# # Explicitly import the viewset for the custom path (No longer needed)
# from .views import CartViewSet

# Create a router using SimpleRouter
router = SimpleRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'addresses', views.AddressViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'cart', views.CartViewSet, basename='cart') # Router handles cart actions
router.register(r'users', views.UserViewSet)
router.register(r'admin/dashboard', views.AdminDashboardView, basename='admin-dashboard')

# URL patterns for the API
urlpatterns = [
    # Include router-generated URLs
    path('', include(router.urls)),
    
    # Note: SimpleRouter generates routes like /cart/ and /cart/{pk}/
    # It does NOT automatically generate the /cart/add_item/ style routes from @actions like DefaultRouter.
    # We need to explicitly add paths for the @action methods if SimpleRouter is used.
    path('cart/current', views.CartViewSet.as_view({'get': 'current'}), name='cart-current'),
    path('cart/add_item', views.CartViewSet.as_view({'post': 'add_item'}), name='cart-add-item'),
    path('cart/update_item', views.CartViewSet.as_view({'post': 'update_item'}), name='cart-update-item'),
    path('cart/remove_item', views.CartViewSet.as_view({'post': 'remove_item'}), name='cart-remove-item'),
    path('cart/clear', views.CartViewSet.as_view({'post': 'clear'}), name='cart-clear'),
    path('cart/create_checkout_session', views.CartViewSet.as_view({'post': 'create_checkout_session'}), name='cart-create-checkout-session'),
    path('cart/create_payment_intent', views.CartViewSet.as_view({'post': 'create_payment_intent'}), name='cart-create-payment-intent'),
    path('cart/checkout', views.CartViewSet.as_view({'post': 'checkout'}), name='cart-checkout'),

    # Add Stripe webhook path explicitly
    path('stripe-webhook/', views.stripe_webhook, name='stripe-webhook'),

    # Keep other specific paths if needed
    # path('api-auth/', include('rest_framework.urls', namespace='rest_framework')) # Example for browsable API login
]

# Ensure OPTIONS requests are handled correctly, usually via CORS middleware or DRF defaults. 