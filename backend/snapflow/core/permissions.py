# core/permissions.py
from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Vérifie si l'utilisateur est un super-admin
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            (
                request.user.is_superuser or 
                (hasattr(request.user, 'groupe_personnalise') and 
                 request.user.groupe_personnalise.role_predefini == 'super-admin')
            )
        )