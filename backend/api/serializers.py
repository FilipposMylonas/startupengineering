from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, Customer, Address, Order, OrderItem, Cart, CartItem


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for the Product model.
    """
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'description', 'image', 
            'stock', 'active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AddressSerializer(serializers.ModelSerializer):
    """
    Serializer for the Address model.
    """
    class Meta:
        model = Address
        fields = [
            'id', 'street_address', 'apartment_address', 'city', 'state',
            'country', 'postal_code', 'default', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for the Customer model.
    """
    addresses = AddressSerializer(many=True, read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'email', 'name', 'device', 'created_at', 'addresses']
        read_only_fields = ['id', 'created_at']


class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the CartItem model.
    """
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total_price']
        read_only_fields = ['id']


class CartSerializer(serializers.ModelSerializer):
    """
    Serializer for the Cart model.
    """
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = Cart
        fields = ['id', 'cart_id', 'items', 'total_items', 'total_price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the OrderItem model.
    """
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price', 'total_price']
        read_only_fields = ['id', 'price']
    
    def create(self, validated_data):
        # Set the price to the current product price
        validated_data['price'] = validated_data['product'].price
        return super().create(validated_data)


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for the Order model.
    """
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = AddressSerializer(read_only=True)
    shipping_address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(),
        write_only=True,
        source='shipping_address'
    )
    customer = CustomerSerializer(read_only=True)
    customer_email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_email', 'shipping_address', 'shipping_address_id',
            'order_date', 'status', 'total_amount', 'notes', 'items'
        ]
        read_only_fields = ['id', 'order_date', 'total_amount']
    
    def create(self, validated_data):
        customer_email = validated_data.pop('customer_email')
        # Get or create customer by email
        customer, created = Customer.objects.get_or_create(email=customer_email)
        validated_data['customer'] = customer
        return super().create(validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model (admin users).
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']
        read_only_fields = ['id', 'is_staff'] 