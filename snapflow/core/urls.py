from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'axes', AxeViewSet)
router.register(r'sous-axes', SousAxeViewSet)
router.register(r'scripts', ScriptViewSet)
router.register(r'projets', ProjetViewSet)
router.register(r'configurations', ConfigurationTestViewSet)
router.register(r'executions', ExecutionTestViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
     path('executions/<int:pk>/rapport-pdf/', RapportPDFView.as_view(), name='rapport_pdf'),
]
