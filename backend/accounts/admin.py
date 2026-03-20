from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'phone', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    fieldsets = UserAdmin.fieldsets + (
        ('Infos Golden Pousso', {'fields': ('phone', 'default_address')}),
    )
