from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def api_root(request):
    return Response({
        'message': 'Bienvenue sur l\'API Golden Pousso',
        'version': 'v1',
        'endpoints': {
            'categories': '/api/v1/categories/',
            'collections': '/api/v1/collections/',
            'products': '/api/v1/products/',
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', api_root, name='api-root'),
    path('api/v1/', include('store.urls')),
    path('api/v1/gestion/', include('store.gestion_urls')),
    path('api/v1/auth/', include('accounts.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
