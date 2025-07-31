# templatetags/custom_filters.py
from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Récupère un item d'un dictionnaire par sa clé"""
    if isinstance(dictionary, dict):
        # Retourne un dictionnaire avec des valeurs par défaut si la clé n'existe pas
        return dictionary.get(key, {"total": 0, "success": 0, "fail": 0})
    return {"total": 0, "success": 0, "fail": 0}

@register.filter
def dict_get(dictionary, key):
    """Alias pour get_item - récupère une valeur dans un dictionnaire"""
    return get_item(dictionary, key)

@register.filter
def get_attr(obj, attr_name):
    """Récupère un attribut d'un objet"""
    try:
        return getattr(obj, attr_name, 0)
    except:
        return 0