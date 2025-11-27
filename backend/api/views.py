import os
import sys
import uuid
import stripe
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404
import json
from django.conf import settings
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from decimal import Decimal

from .models import Product, Customer, Address, Order, OrderItem, Cart, CartItem
from .serializers import (
    ProductSerializer, CustomerSerializer, AddressSerializer,
    OrderSerializer, OrderItemSerializer, CartSerializer, CartItemSerializer,
    UserSerializer
)


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for products.
    Public users can list and retrieve.
    Admin users can create, update, and delete.
    """
    queryset = Product.objects.filter(active=True)
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        """
        Admin permissions for create, update, delete.
        Public users can list and retrieve.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]


class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for customers.
    Admin only.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['get'])
    def orders(self, request, pk=None):
        """Get orders for a specific customer."""
        customer = self.get_object()
        orders = Order.objects.filter(customer=customer)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class AddressViewSet(viewsets.ModelViewSet):
    """
    API endpoint for addresses.
    Admin only.
    """
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def by_customer(self, request):
        """Get addresses by customer email."""
        email = request.query_params.get('email', None)
        if email:
            customer = get_object_or_404(Customer, email=email)
            addresses = Address.objects.filter(customer=customer)
            serializer = self.get_serializer(addresses, many=True)
            return Response(serializer.data)
        return Response(
            {"error": "Customer email parameter is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for orders.
    Public users can create.
    Admin users can view, update, and delete.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_permissions(self):
        """
        Admin permissions for all actions except create.
        Public users can create orders.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def by_email(self, request):
        """Get orders by customer email."""
        email = request.query_params.get('email', None)
        if email:
            orders = Order.objects.filter(customer__email=email)
            serializer = self.get_serializer(orders, many=True)
            return Response(serializer.data)
        return Response(
            {"error": "Customer email parameter is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class CartViewSet(viewsets.ModelViewSet):
    """
    API endpoint for shopping carts.
    No authentication required - uses cookies to track users.
    """
    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Cart.objects.all()
    
    def get_permissions(self):
        """
        Override to ensure all cart actions are publicly accessible.
        """
        return [permissions.AllowAny()]
    
    def dispatch(self, request, *args, **kwargs):
        """
        Override dispatch to debug HTTP method issues
        """
        print(f"[DEBUG] Request method: {request.method}")
        print(f"[DEBUG] Request path: {request.path}")
        print(f"[DEBUG] Request headers: {request.headers}")
        
        # Special handling for OPTIONS requests
        if request.method.lower() == 'options':
            response = self.options(request, *args, **kwargs)
            response["Allow"] = ", ".join(self._allowed_methods())
            response["Access-Control-Allow-Methods"] = response["Allow"]
            response["Access-Control-Allow-Headers"] = "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with"
            return response
            
        return super().dispatch(request, *args, **kwargs)
    
    def get_cart(self, request):
        """
        Get the cart from the cookie or create a new one.
        Avoids creating a customer based solely on device_id to prevent IntegrityError.
        """
        cart_id = request.COOKIES.get('cart_id', None)
        print(f"[DEBUG get_cart] Received cart_id from cookie: {cart_id}")
        cart = None
        created = False

        if cart_id:
            # Try to fetch existing cart
            try:
                cart = Cart.objects.get(cart_id=cart_id)
                print(f"[DEBUG get_cart] Found/Created cart with DB ID: {cart.pk}, Cart ID: {cart.cart_id}")
            except Cart.DoesNotExist:
                # If cart with this ID doesn't exist, log the issue and create a new one below
                print(f"Cart with ID {cart_id} from cookie not found in database. Creating new cart.")
                cart_id = None # Force creation of a new cart ID

        if not cart:
            # Generate a new cart ID and create the cart
            cart_id = str(uuid.uuid4())
            cart = Cart.objects.create(cart_id=cart_id)
            created = True
            # We don't associate customer here based on device_id anymore

        if cart:
             print(f"[DEBUG get_cart] Found/Created cart with DB ID: {cart.pk}, Cart ID: {cart.cart_id}")
        else:
             print(f"[DEBUG get_cart] Cart object is None after lookup/creation attempt.")
        return cart, created
    
    def set_cart_cookie(self, response, cart_id):
        """
        Helper method to set cart_id cookie with proper settings based on environment
        """
        from django.conf import settings
        
        secure = True  # True for all environments
        samesite = 'None'  # None for cross-site cookies
        
        response.set_cookie(
            'cart_id',
            cart_id,
            max_age=30*24*60*60,  # 30 days
            httponly=False,  # Allow JavaScript access
            samesite=samesite,
            secure=secure,
            path='/',  # Available across the site
        )
        return response
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """
        Get or create the current cart for this user.
        """
        try:
            print("[DEBUG current] Starting current cart method in ViewSet")
            cart, created = self.get_cart(request)
            if cart:
                print(f"[DEBUG current] Cart state before serialization: ID={cart.cart_id}, Items Count={cart.items.count()}")
                for item in cart.items.all():
                    print(f"  - Item: {item.product.name}, Qty: {item.quantity}")
            else:
                print("[DEBUG current] Cart object is None after get_cart.")
            serializer = self.get_serializer(cart)
            response = Response(serializer.data)
            
            # Set cookie using the helper method
            return self.set_cart_cookie(response, cart.cart_id)
        except Exception as e:
            import traceback
            print(f"[ERROR] Error in current cart: {str(e)}")
            traceback.print_exc()
            # Return an empty cart as fallback
            return Response({
                "cart_id": str(uuid.uuid4()),
                "items": [],
                "total_items": 0,
                "total_price": "0.00"
            })
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """
        Add an item to the cart.
        """
        print("[DEBUG add_item] Starting add_item method in ViewSet")
        cart, created = self.get_cart(request)
        
        # Validate request data
        product_id = request.data.get('product_id', None)
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response(
                {"error": "Product ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(id=product_id, active=True)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create cart item
        cart_item, cart_item_created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        # If the item already exists, update its quantity
        if not cart_item_created:
            cart_item.quantity += quantity
        
        print(f"[DEBUG add_item] Attempting to save CartItem: Product={product.id}, Qty={cart_item.quantity}, Cart ID={cart.cart_id}")
        cart_item.save()
        print(f"[DEBUG add_item] CartItem saved. Verifying cart state from DB...")
        
        # Explicitly refresh cart from DB and check items
        cart.refresh_from_db()
        items_in_cart = cart.items.all()
        print(f"[DEBUG add_item] Cart state post-save: ID={cart.cart_id}, Items Count={items_in_cart.count()}")
        for item in items_in_cart:
            print(f"  - Item: {item.product.name}, Qty: {item.quantity}")
        
        # Serialize the updated cart
        cart_serializer = self.get_serializer(cart)
        print(f"[DEBUG add_item] Serialized cart data: {cart_serializer.data}")
        response = Response(cart_serializer.data)
        
        # Set cookie using the helper method
        print(f"[DEBUG add_item] Setting cookie with cart_id: {cart.cart_id}")
        return self.set_cart_cookie(response, cart.cart_id)
    
    @action(detail=False, methods=['post'])
    def update_item(self, request):
        """
        Update an item's quantity in the cart.
        """
        cart, _ = self.get_cart(request)
        
        # Validate request data
        product_id = request.data.get('product_id', None)
        quantity = request.data.get('quantity', None)
        
        if not product_id or quantity is None:
            return Response(
                {"error": "Product ID and quantity are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quantity = int(quantity)
        
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found in cart"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Update quantity or remove if quantity is 0
        if quantity > 0:
            cart_item.quantity = quantity
            cart_item.save()
        else:
            cart_item.delete()
        
        # Return the updated cart
        cart_serializer = self.get_serializer(cart)
        response = Response(cart_serializer.data)
        
        # Set cookie using the helper method
        return self.set_cart_cookie(response, cart.cart_id)
    
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """
        Remove an item from the cart.
        """
        cart, _ = self.get_cart(request)
        
        # Validate request data
        product_id = request.data.get('product_id', None)
        
        if not product_id:
            return Response(
                {"error": "Product ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found in cart"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Remove the item from the cart
        cart_item.delete()
        
        # Return the updated cart
        cart_serializer = self.get_serializer(cart)
        response = Response(cart_serializer.data)
        
        # Set cookie using the helper method
        return self.set_cart_cookie(response, cart.cart_id)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """
        Clear all items from the cart.
        """
        cart, _ = self.get_cart(request)
        CartItem.objects.filter(cart=cart).delete()
        
        # Return the empty cart
        cart_serializer = self.get_serializer(cart)
        response = Response(cart_serializer.data)
        
        # Set cookie using the helper method
        return self.set_cart_cookie(response, cart.cart_id)
    
    @action(detail=False, methods=['post'])
    def create_payment_intent(self, request):
        """
        Creates a Stripe PaymentIntent for the current cart.
        Expects cart_id to be in cookies or creates a new cart.
        Calculates total amount based on cart items.
        Returns the client_secret for the PaymentIntent.
        """
        try:
            cart, _ = self.get_cart(request)
            cart_items = CartItem.objects.filter(cart=cart)

            if not cart_items.exists():
                return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate total amount in cents
            total_amount = 0
            for item in cart_items:
                # Ensure price is converted to cents correctly
                # Assuming item.product.price is in dollars (e.g., Decimal or float)
                item_price_cents = int(item.product.price * 100) 
                total_amount += item.quantity * item_price_cents

            if total_amount <= 0:
                 return Response({"error": "Invalid cart total"}, status=status.HTTP_400_BAD_REQUEST)

            # Initialize Stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY

            # Create a PaymentIntent with the order amount and currency
            intent = stripe.PaymentIntent.create(
                amount=total_amount,
                currency='usd',  # Or get from settings/request
                # Add metadata if needed, e.g., linking to your Cart or Order ID
                metadata={
                    'cart_id': cart.cart_id,
                    # 'user_id': request.user.id if request.user.is_authenticated else None, 
                }
            )

            return Response({
                'clientSecret': intent.client_secret
            })

        except Product.DoesNotExist:
             return Response({"error": "A product in the cart was not found."}, status=status.HTTP_404_NOT_FOUND)
        except Cart.DoesNotExist:
             # This case might be handled by get_cart creating a new one, but good to be safe
             return Response({"error": "Cart not found."}, status=status.HTTP_404_NOT_FOUND)
        except stripe.error.StripeError as e:
            # Handle specific Stripe errors
            return Response({"error": f"Stripe error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            # Catch other potential errors
            print(f"Error creating payment intent: {e}") # Log the error
            return Response({"error": "An unexpected error occurred"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def create_checkout_session(self, request):
        """
        Creates a Stripe Checkout Session for the current cart.
        Redirects the user to Stripe's hosted checkout page.
        """
        print(f"[DEBUG] Starting create_checkout_session method")
        print(f"[DEBUG] Request method: {request.method}")
        print(f"[DEBUG] Request content type: {request.content_type}")
        print(f"[DEBUG] Request path: {request.path}")
        print(f"[DEBUG] Request headers: {request.headers}")
        
        if request.method.lower() == 'options':
            response = Response()
            response["Allow"] = "POST, OPTIONS"
            response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response["Access-Control-Allow-Headers"] = "accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with"
            return response
        
        try:
            # Print debug information
            print("Creating checkout session")
            print(f"Request data: {request.data}")
            print(f"Stripe Key: {settings.STRIPE_SECRET_KEY[:4]}...{settings.STRIPE_SECRET_KEY[-4:] if settings.STRIPE_SECRET_KEY else 'None'}")
            
            cart, _ = self.get_cart(request)
            cart_items = CartItem.objects.filter(cart=cart)

            if not cart_items.exists():
                return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

            # Get success and cancel URLs from the frontend
            success_url = request.data.get('success_url', 'http://localhost:3000/checkout-success')
            cancel_url = request.data.get('cancel_url', 'http://localhost:3000/cart')
            
            print(f"Success URL: {success_url}")
            print(f"Cancel URL: {cancel_url}")

            # Initialize Stripe (stripe is now guaranteed to be imported)
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            # Check if api_key is set
            if not stripe.api_key or settings.STRIPE_SECRET_KEY == 'sk_test_placeholder':
                return Response({"error": "Stripe API key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Prepare line items for Stripe Checkout
            line_items = []
            for item in cart_items:
                product = item.product
                
                # Prepare product data
                product_data = {
                    'name': product.name,
                }
                
                # Add description if available
                if product.description:
                    product_data['description'] = product.description[:500]
                
                # Handle product images - simplify for production
                images = []
                if product.image and hasattr(product.image, 'url'):
                    try:
                        # Use a simple approach for production
                        image_url = product.image.url
                        if not image_url.startswith(('http://', 'https://')):
                            # Use a default image if the URL is relative
                            image_url = "https://placehold.co/400x300?text=Product+Image"
                        images.append(image_url)
                    except Exception as e:
                        print(f"Error processing image: {e}")
                
                if images:
                    product_data['images'] = images
                
                # Create the line item
                line_items.append({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': product_data,
                        'unit_amount': int(product.price * 100),  # Convert to cents
                    },
                    'quantity': item.quantity,
                })

            # Create checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'cart_id': cart.cart_id,
                },
                shipping_address_collection={
                    'allowed_countries': ['US', 'CA', 'GB', 'AU'],  # Add countries you ship to
                },
            )

            # Return the checkout session URL to the frontend
            return Response({
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id
            })

        except Product.DoesNotExist:
            print("Error: Product not found")
            return Response({"error": "A product in the cart was not found."}, status=status.HTTP_404_NOT_FOUND)
        except Cart.DoesNotExist:
            print("Error: Cart not found")
            return Response({"error": "Cart not found."}, status=status.HTTP_404_NOT_FOUND)
        except stripe.error.StripeError as e:
            print(f"Stripe error: {str(e)}")
            return Response({"error": f"Stripe error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Error creating checkout session: {e}")  # Log the error
            import traceback
            traceback.print_exc()
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """
        Create an order from the cart.
        """
        cart, _ = self.get_cart(request)
        
        if not cart.items.exists():
            return Response(
                {"error": "Cannot checkout an empty cart"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate required data
        email = request.data.get('customer_email')
        shipping_address_data = request.data.get('shipping_address')
        
        if not email or not shipping_address_data:
            return Response(
                {"error": "Email and shipping address are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create customer
        customer, created = Customer.objects.get_or_create(
            email=email,
            defaults={'device': request.COOKIES.get('device_id')}
        )
        
        # If cart had a different customer (e.g., device-based), update it
        if cart.customer and cart.customer != customer:
            # If the device-based customer has no email, associate them
            if cart.customer.email is None:
                cart.customer.email = email
                cart.customer.save()
                customer = cart.customer
            else:
                # Update the cart to the email-based customer
                cart.customer = customer
                cart.save()
        
        # Create or get the shipping address
        shipping_address, _ = Address.objects.get_or_create(
            customer=customer,
            street_address=shipping_address_data.get('street_address'),
            apartment_address=shipping_address_data.get('apartment_address', ''),
            city=shipping_address_data.get('city'),
            state=shipping_address_data.get('state'),
            country=shipping_address_data.get('country'),
            postal_code=shipping_address_data.get('postal_code'),
            defaults={'default': shipping_address_data.get('default', False)}
        )
        
        # Create order
        order = Order.objects.create(
            customer=customer,
            shipping_address=shipping_address,
            status='pending',
            notes=request.data.get('notes', '')
        )
        
        # Create order items from cart items
        total_amount = 0
        for cart_item in cart.items.all():
            price = cart_item.product.price
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                price=price
            )
            total_amount += price * cart_item.quantity
        
        # Update order total
        order.total_amount = total_amount
        order.save()
        
        # Clear the cart
        CartItem.objects.filter(cart=cart).delete()
        
        # Return the order data
        order_serializer = OrderSerializer(order)
        response = Response(order_serializer.data)
        
        # Set cookie using the helper method
        return self.set_cart_cookie(response, cart.cart_id)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for admin users.
    Admin only.
    """
    queryset = User.objects.filter(is_staff=True)
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current admin user's profile."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class AdminDashboardView(viewsets.ViewSet):
    """
    Admin dashboard view that provides various statistics.
    """
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get basic statistics for the admin dashboard.
        """
        # Count total products
        total_products = Product.objects.count()
        active_products = Product.objects.filter(active=True).count()
        
        # Count orders by status
        orders_by_status = {}
        for status, _ in Order.STATUS_CHOICES:
            orders_by_status[status] = Order.objects.filter(status=status).count()
        
        # Get recent orders
        recent_orders = Order.objects.order_by('-order_date')[:5]
        recent_orders_data = OrderSerializer(recent_orders, many=True).data
        
        # Count total customers
        total_customers = Customer.objects.filter(email__isnull=False).count()
        
        # Get orders over time (last 30 days)
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        orders_over_time = Order.objects.filter(
            order_date__gte=thirty_days_ago
        ).extra(
            select={'date': "date(order_date)"}
        ).values('date').annotate(
            count=models.Count('id'),
            revenue=models.Sum('total_amount')
        ).order_by('date')
        
        # Sales statistics
        total_sales = Order.objects.aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
        
        return Response({
            'products': {
                'total': total_products,
                'active': active_products,
            },
            'orders': {
                'by_status': orders_by_status,
                'recent': recent_orders_data,
                'over_time': list(orders_over_time),
            },
            'customers': {
                'total': total_customers,
            },
            'sales': {
                'total': float(total_sales),
            }
        })


# === Stripe Webhook ===

@csrf_exempt # Disable CSRF protection for webhook endpoint
@api_view(['POST']) # Only allow POST requests
def stripe_webhook(request):
    """
    Listens for and processes incoming webhook events from Stripe.
    Verifies the signature and handles specific events like payment_intent.succeeded.
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET
    event = None

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        # Invalid payload
        print(f"Webhook error: Invalid payload - {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"Webhook error: Invalid signature - {e}")
        return HttpResponse(status=400)
    except Exception as e:
        print(f"Webhook error: Generic exception - {e}")
        return HttpResponse(status=500)

    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object'] # contains a stripe.PaymentIntent
        print('PaymentIntent was successful!')
        # TODO: Implement fulfillment logic here
        # 1. Get cart_id from metadata
        cart_id = payment_intent.get('metadata', {}).get('cart_id')
        if not cart_id:
            print("Error: cart_id not found in PaymentIntent metadata")
            # Decide how to handle this - maybe still mark payment successful?
            return HttpResponse(status=400) # Or 200 if we just log the error?

        # 2. Find the Order associated with this cart (or the cart itself)
        #    This might depend on whether the Order is created *before* or *after* payment.
        #    Let's assume an Order is created during checkout (as seen in CartViewSet.checkout)
        #    and we need to find it and mark it as paid.
        try:
            # Option A: Find order via Cart (if cart persists after checkout - likely not ideal)
            # cart = Cart.objects.get(cart_id=cart_id)
            # order = Order.objects.get(cart=cart) # Requires Order model to link to Cart
            
            # Option B: Find order via Customer (if PI has customer info or cart has customer)
            # This requires linking PaymentIntent metadata more robustly or querying differently
            # For now, let's assume we need to find the Order based on something related to the cart_id
            # Perhaps the checkout process should store the PI id on the Order? 
            # Or maybe the cart_id is sufficient if the Order has a reference to it? 
            
            # Let's try finding the most recent 'pending' order associated with the customer from the cart
            cart = Cart.objects.get(cart_id=cart_id)
            if cart.customer:
                order = Order.objects.filter(customer=cart.customer, status='pending').order_by('-order_date').first()
                if order:
                    print(f"Found pending order {order.id} for customer {cart.customer.id}")
                    order.status = 'paid' # Or 'processing', depending on your flow
                    order.payment_intent_id = payment_intent.id # Store the PI ID
                    order.save()
                    print(f"Order {order.id} marked as paid.")
                    # Optional: Clear the cart now that the order is paid
                    # CartItem.objects.filter(cart=cart).delete()
                    # print(f"Cart {cart_id} cleared.")
                else:
                    print(f"Webhook Error: No pending order found for customer {cart.customer.id} associated with cart {cart_id}")
                    # Potentially create the order here if it wasn't created at checkout? Risky.
            else:
                 print(f"Webhook Error: Cart {cart_id} has no associated customer.")

        except Cart.DoesNotExist:
            print(f"Webhook Error: Cart with ID {cart_id} not found.")
            return HttpResponse(status=404) 
        # except Order.DoesNotExist: # If using Order.objects.get()
        #     print(f"Webhook Error: Order associated with cart {cart_id} not found.")
        #     return HttpResponse(status=404)
        except Exception as e:
            print(f"Webhook fulfillment error: {e}")
            return HttpResponse(status=500) # Internal server error during fulfillment

    elif event['type'] == 'checkout.session.completed':
        session = event['data']['object']  # contains a stripe.Session
        print('Checkout session was completed!')
        
        # Get cart_id from metadata
        cart_id = session.get('metadata', {}).get('cart_id')
        if not cart_id:
            print("Error: cart_id not found in Checkout Session metadata")
            return HttpResponse(status=400)
        
        try:
            cart = Cart.objects.get(cart_id=cart_id)
            cart_items = CartItem.objects.filter(cart=cart)
            
            if not cart_items.exists():
                print(f"Warning: Cart {cart_id} has no items")
                return HttpResponse(status=200)
            
            # Get customer information from the session
            customer_email = session.get('customer_details', {}).get('email')
            if not customer_email:
                print("Warning: No customer email in checkout session")
                return HttpResponse(status=200)
            
            # Get or create customer
            customer, created = Customer.objects.get_or_create(
                email=customer_email,
                defaults={'device': None}
            )
            
            # Update cart customer if needed
            if cart.customer and cart.customer != customer:
                if cart.customer.email is None:
                    cart.customer.email = customer_email
                    cart.customer.save()
                    customer = cart.customer
                else:
                    cart.customer = customer
                    cart.save()
            elif not cart.customer:
                cart.customer = customer
                cart.save()
            
            # Get shipping details from the session
            shipping_details = session.get('shipping_details', {})
            shipping_address_data = shipping_details.get('address', {})
            
            if shipping_address_data:
                # Create or get shipping address
                shipping_address, _ = Address.objects.get_or_create(
                    customer=customer,
                    street_address=shipping_address_data.get('line1', ''),
                    apartment_address=shipping_address_data.get('line2', ''),
                    city=shipping_address_data.get('city', ''),
                    state=shipping_address_data.get('state', ''),
                    country=shipping_address_data.get('country', ''),
                    postal_code=shipping_address_data.get('postal_code', ''),
                    defaults={'default': True}
                )
                
                # Create order
                order = Order.objects.create(
                    customer=customer,
                    shipping_address=shipping_address,
                    status='paid',  # Order is already paid through Stripe Checkout
                    payment_intent_id=session.get('payment_intent'),
                    notes=f"Order created from Stripe Checkout session {session.id}"
                )
                
                # Create order items and calculate total
                total_amount = 0
                for cart_item in cart_items:
                    price = cart_item.product.price
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        price=price
                    )
                    total_amount += price * cart_item.quantity
                
                # Update order total
                order.total_amount = total_amount
                order.save()
                
                # Clear the cart
                cart_items.delete()
                
                print(f"Successfully created Order {order.id} from Checkout Session {session.id}")
            else:
                print("Warning: No shipping address in checkout session")
        
        except Cart.DoesNotExist:
            print(f"Webhook Error: Cart with ID {cart_id} not found.")
            return HttpResponse(status=404)
        except Exception as e:
            print(f"Webhook error processing checkout session: {e}")
            return HttpResponse(status=500)

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        print('PaymentIntent failed.')
        # TODO: Notify user, update order status to 'failed', etc.
        error_message = payment_intent.get('last_payment_error', {}).get('message')
        print(f"Failure reason: {error_message}")
        # Find order and mark as failed?

    # ... handle other event types as needed ...
    else:
        print(f'Unhandled event type {event["type"]}')

    # Acknowledge receipt of the event to Stripe
    return HttpResponse(status=200) 