from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.db.models import Sum, Count, Q, F
from django.template.response import TemplateResponse
from django.utils.safestring import mark_safe
from django.db.models.functions import TruncDay
from django.utils import timezone
import datetime

from .models import Product, Customer, Address, Order, OrderItem, Cart, CartItem


class AddressInline(admin.TabularInline):
    model = Address
    extra = 0
    fields = ('street_address', 'city', 'state', 'country', 'postal_code', 'default')


class OrderInline(admin.TabularInline):
    model = Order
    extra = 0
    fields = ('id', 'status', 'order_date', 'total_amount')
    readonly_fields = ('id', 'order_date', 'total_amount')
    can_delete = False
    show_change_link = True
    max_num = 5
    verbose_name = "Recent Order"
    verbose_name_plural = "Recent Orders"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.order_by('-order_date')[:5]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product', 'quantity', 'price', 'total_price')
    readonly_fields = ('total_price',)


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ('product', 'quantity')


class HasOrderedFilter(admin.SimpleListFilter):
    title = 'has placed an order'
    parameter_name = 'has_ordered'
    
    def lookups(self, request, model_admin):
        return (
            ('yes', 'Yes'),
            ('no', 'No'),
        )
    
    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(orders__isnull=False).distinct()
        if self.value() == 'no':
            return queryset.filter(orders__isnull=True)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('email', 'name', 'device', 'created_at', 'address_count', 'order_count', 'order_value', 'has_ordered')
    search_fields = ('email', 'name', 'device')
    list_filter = ('created_at', HasOrderedFilter)
    inlines = [AddressInline, OrderInline]
    readonly_fields = ('created_at', 'order_value', 'last_order_date')
    fieldsets = (
        ('Customer Information', {
            'fields': ('email', 'name', 'device', 'created_at')
        }),
        ('Order Statistics', {
            'fields': ('order_value', 'last_order_date'),
            'classes': ('collapse',),
        }),
    )
    
    def address_count(self, obj):
        count = obj.addresses.count()
        if count > 0:
            url = reverse('admin:api_address_changelist') + f'?customer__id__exact={obj.id}'
            return format_html('<a href="{}">{}</a>', url, count)
        return "0"
    address_count.short_description = 'Addresses'
    
    def order_count(self, obj):
        count = obj.orders.count()
        if count > 0:
            url = reverse('admin:api_order_changelist') + f'?customer__id__exact={obj.id}'
            return format_html('<a href="{}">{}</a>', url, count)
        return "0"
    order_count.short_description = 'Orders'
    
    def order_value(self, obj):
        total = obj.orders.aggregate(total=Sum('total_amount'))['total'] or 0
        return f"${total:.2f}"
    order_value.short_description = 'Total Spent'
    
    def last_order_date(self, obj):
        last_order = obj.orders.order_by('-order_date').first()
        if last_order:
            return last_order.order_date
        return "No orders"
    last_order_date.short_description = 'Last Order Date'
    
    def has_ordered(self, obj):
        has_order = obj.orders.exists()
        icon = "✅" if has_order else "❌"
        return format_html('<span style="color: {};">{}</span>', 
                         'green' if has_order else 'red', 
                         icon)
    has_ordered.short_description = 'Has Ordered'
    has_ordered.boolean = True


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('customer_link', 'street_address', 'city', 'country', 'default')
    list_filter = ('country', 'state', 'city', 'default')
    search_fields = ('street_address', 'city', 'customer__email')
    autocomplete_fields = ('customer',)
    fieldsets = (
        ('Customer', {
            'fields': ('customer',)
        }),
        ('Address Information', {
            'fields': ('street_address', 'apartment_address', 'city', 'state', 'country', 'postal_code')
        }),
        ('Settings', {
            'fields': ('default',)
        }),
    )
    
    def customer_link(self, obj):
        if obj.customer:
            url = reverse('admin:api_customer_change', args=[obj.customer.id])
            return format_html('<a href="{}">{}</a>', url, obj.customer.email)
        return "-"
    customer_link.short_description = 'Customer'
    customer_link.admin_order_field = 'customer__email'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'active', 'product_image', 'total_sold', 'created_at')
    list_filter = ('active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'total_sold', 'revenue')
    list_editable = ('price', 'stock', 'active')
    fieldsets = (
        ('Product Information', {
            'fields': ('name', 'description', 'price', 'image')
        }),
        ('Inventory', {
            'fields': ('stock', 'active')
        }),
        ('Sales Statistics', {
            'fields': ('total_sold', 'revenue'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def product_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="object-fit: cover;" />', obj.image.url)
        return "-"
    product_image.short_description = 'Image'
    
    def total_sold(self, obj):
        return OrderItem.objects.filter(product=obj).aggregate(total=Sum('quantity'))['total'] or 0
    total_sold.short_description = 'Units Sold'
    
    def revenue(self, obj):
        total = OrderItem.objects.filter(product=obj).aggregate(
            total=Sum(F('price') * F('quantity'))
        )['total'] or 0
        return f"${total:.2f}"
    revenue.short_description = 'Total Revenue'


class OrderStatusFilter(admin.SimpleListFilter):
    title = 'Order Status'
    parameter_name = 'status'
    
    def lookups(self, request, model_admin):
        return Order.STATUS_CHOICES
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(status=self.value())
        return queryset


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_link', 'status_colored', 'items_count', 'total_amount', 'order_date')
    list_filter = (OrderStatusFilter, 'order_date')
    search_fields = ('id', 'customer__email', 'customer__name')
    readonly_fields = ('id', 'order_date', 'total_amount', 'shipping_address_display')
    inlines = [OrderItemInline]
    date_hierarchy = 'order_date'
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'customer', 'status', 'order_date', 'total_amount')
        }),
        ('Shipping', {
            'fields': ('shipping_address', 'shipping_address_display'),
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',),
        }),
    )
    actions = ['mark_as_processing', 'mark_as_shipped', 'mark_as_delivered', 'mark_as_cancelled']
    
    def customer_link(self, obj):
        if obj.customer:
            url = reverse('admin:api_customer_change', args=[obj.customer.id])
            return format_html('<a href="{}">{}</a>', url, obj.customer.email)
        return "-"
    customer_link.short_description = 'Customer'
    customer_link.admin_order_field = 'customer__email'
    
    def status_colored(self, obj):
        colors = {
            'pending': 'orange',
            'processing': 'blue',
            'shipped': 'purple',
            'delivered': 'green',
            'cancelled': 'red',
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 4px;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    status_colored.admin_order_field = 'status'
    
    def items_count(self, obj):
        count = obj.items.count()
        return count
    items_count.short_description = 'Items'
    
    def shipping_address_display(self, obj):
        if obj.shipping_address:
            addr = obj.shipping_address
            return format_html(
                '<p><strong>Street:</strong> {}<br/>'
                '<strong>City:</strong> {}, {} {}<br/>'
                '<strong>Country:</strong> {}</p>',
                f"{addr.street_address} {addr.apartment_address or ''}",
                addr.city,
                addr.state,
                addr.postal_code,
                addr.country
            )
        return "-"
    shipping_address_display.short_description = 'Shipping Address Details'
    
    def mark_as_processing(self, request, queryset):
        updated = queryset.update(status='processing')
        self.message_user(request, f"{updated} orders marked as processing.")
    mark_as_processing.short_description = "Mark selected orders as processing"
    
    def mark_as_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f"{updated} orders marked as shipped.")
    mark_as_shipped.short_description = "Mark selected orders as shipped"
    
    def mark_as_delivered(self, request, queryset):
        updated = queryset.update(status='delivered')
        self.message_user(request, f"{updated} orders marked as delivered.")
    mark_as_delivered.short_description = "Mark selected orders as delivered"
    
    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='cancelled')
        self.message_user(request, f"{updated} orders marked as cancelled.")
    mark_as_cancelled.short_description = "Mark selected orders as cancelled"


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_link', 'product_link', 'quantity', 'price', 'total_price')
    list_filter = ('order__status',)
    search_fields = ('order__id', 'product__name')
    autocomplete_fields = ('order', 'product')
    readonly_fields = ('total_price',)
    
    def order_link(self, obj):
        url = reverse('admin:api_order_change', args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.id)
    order_link.short_description = 'Order'
    order_link.admin_order_field = 'order'
    
    def product_link(self, obj):
        url = reverse('admin:api_product_change', args=[obj.product.id])
        return format_html('<a href="{}">{}</a>', url, obj.product.name)
    product_link.short_description = 'Product'
    product_link.admin_order_field = 'product__name'


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('cart_id', 'customer_link', 'total_items', 'total_price', 'updated_at')
    search_fields = ('cart_id', 'customer__email')
    readonly_fields = ('cart_id', 'created_at', 'updated_at', 'total_items', 'total_price')
    inlines = [CartItemInline]
    fieldsets = (
        ('Cart Information', {
            'fields': ('cart_id', 'customer', 'created_at', 'updated_at')
        }),
        ('Summary', {
            'fields': ('total_items', 'total_price')
        }),
    )
    
    def customer_link(self, obj):
        if obj.customer:
            url = reverse('admin:api_customer_change', args=[obj.customer.id])
            return format_html('<a href="{}">{}</a>', url, obj.customer.email or f"Anonymous ({obj.customer.device})")
        return "-"
    customer_link.short_description = 'Customer'
    customer_link.admin_order_field = 'customer__email'


# Custom Admin Dashboard
class AshtrayAdminSite(admin.AdminSite):
    site_header = 'AshtrayWEB Admin'
    site_title = 'AshtrayWEB E-commerce'
    index_title = 'Dashboard'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
    
    def index(self, request, extra_context=None):
        # Redirect the index to our custom dashboard
        return self.dashboard_view(request)
    
    def dashboard_view(self, request):
        # Get basic statistics
        today = timezone.now().date()
        thirty_days_ago = today - datetime.timedelta(days=30)
        seven_days_ago = today - datetime.timedelta(days=7)
        
        # Revenue statistics
        total_revenue = Order.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        month_revenue = Order.objects.filter(order_date__gte=thirty_days_ago).aggregate(total=Sum('total_amount'))['total'] or 0
        week_revenue = Order.objects.filter(order_date__gte=seven_days_ago).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Order statistics
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status='pending').count()
        processing_orders = Order.objects.filter(status='processing').count()
        shipped_orders = Order.objects.filter(status='shipped').count()
        delivered_orders = Order.objects.filter(status='delivered').count()
        cancelled_orders = Order.objects.filter(status='cancelled').count()
        
        # Recent orders
        recent_orders = Order.objects.order_by('-order_date')[:10]
        
        # Customer statistics
        total_customers = Customer.objects.count()
        customers_with_orders = Customer.objects.filter(orders__isnull=False).distinct().count()
        customers_without_orders = total_customers - customers_with_orders
        
        # Product statistics
        total_products = Product.objects.count()
        active_products = Product.objects.filter(active=True).count()
        
        # Top selling products
        top_products = Product.objects.annotate(
            units_sold=Sum('orderitem__quantity')
        ).filter(units_sold__isnull=False).order_by('-units_sold')[:5]
        
        # Daily sales chart data
        daily_sales = Order.objects.filter(
            order_date__gte=thirty_days_ago
        ).annotate(
            day=TruncDay('order_date')
        ).values('day').annotate(
            count=Count('id'),
            revenue=Sum('total_amount')
        ).order_by('day')
        
        # Format chart data for JS
        days = [item['day'].strftime('%Y-%m-%d') for item in daily_sales]
        revenue_data = [float(item['revenue']) if item['revenue'] else 0 for item in daily_sales]
        count_data = [item['count'] for item in daily_sales]
        
        context = {
            'title': 'E-commerce Dashboard',
            **self.each_context(request),
            'total_revenue': total_revenue,
            'month_revenue': month_revenue,
            'week_revenue': week_revenue,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'processing_orders': processing_orders,
            'shipped_orders': shipped_orders,
            'delivered_orders': delivered_orders, 
            'cancelled_orders': cancelled_orders,
            'total_customers': total_customers,
            'customers_with_orders': customers_with_orders,
            'customers_without_orders': customers_without_orders,
            'total_products': total_products,
            'active_products': active_products,
            'recent_orders': recent_orders,
            'top_products': top_products,
            'chart_days': days,
            'chart_revenue': revenue_data,
            'chart_count': count_data,
        }
        
        return TemplateResponse(request, 'admin/dashboard.html', context)


# Register with custom admin site
admin_site = AshtrayAdminSite(name='admin')

# Re-register all models with the custom admin site
admin_site.register(Customer, CustomerAdmin)
admin_site.register(Address, AddressAdmin)
admin_site.register(Product, ProductAdmin)
admin_site.register(Order, OrderAdmin)
admin_site.register(OrderItem, OrderItemAdmin)
admin_site.register(Cart, CartAdmin)

# Import and register Django built-in models you need
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin, GroupAdmin
admin_site.register(User, UserAdmin)
admin_site.register(Group, GroupAdmin) 