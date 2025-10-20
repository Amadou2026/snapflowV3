# core/utils.py
from django.contrib.auth.models import Permission

def has_permission(user, permission_codename):
    """
    Vérifie si un utilisateur a une permission spécifique
    """
    if user.is_superuser:
        return True
    
    # Vérifier si l'utilisateur a un groupe personnalisé avec la permission
    if hasattr(user, 'groupe_personnalise'):
        return user.groupe_personnalise.permissions.filter(
            codename=permission_codename
        ).exists()
    
    # Vérifier les permissions Django standard
    return user.has_perm(f"core.{permission_codename}")