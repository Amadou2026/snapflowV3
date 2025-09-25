from rest_framework import serializers
from .models import *

class SocieteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url',
            'secteur_activite', 'admin', 'projet', 'employes'
        ]

class CustomUserSerializer(serializers.ModelSerializer):
    societes = SocieteSerializer(source='societes_employes', many=True, read_only=True)
    
    # Pour l'affichage lisible
    groupes = serializers.SerializerMethodField(read_only=True)
    
    # Pour l'écriture (PrimaryKeyRelatedField avec les vrais ids de auth_group)
    groups = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Group.objects.all(), 
        required=False
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'is_superuser', 'is_staff', 'is_active',
            'societes', 'groupes', 'groups', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']

    def get_groupes(self, obj):
        # On renvoie les id + nom des auth_group
        result = []
        for g in obj.groups.all():
            try:
                gp = g.groupe_personnalise
                result.append({
                    'id': g.id,  # id de auth_group
                    'nom': gp.nom,
                    'role_predefini': gp.role_predefini
                })
            except GroupePersonnalise.DoesNotExist:
                result.append({
                    'id': g.id,
                    'nom': g.name,
                    'role_predefini': None
                })
        return result



class AxeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Axe
        fields = '__all__'


class SousAxeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SousAxe
        fields = '__all__'


class ScriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Script
        fields = '__all__'


class ProjetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Projet
        fields = '__all__'

class EmailNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailNotification
        fields = ['id', 'email']
        
class ConfigurationTestSerializer(serializers.ModelSerializer):
    emails_notification = EmailNotificationSerializer(many=True)
    class Meta:
        model = ConfigurationTest
        fields = '__all__'


class ExecutionTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionTest
        fields = '__all__'


class ExecutionTestExportSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source='configuration.projet.nom', read_only=True)

    class Meta:
        model = ExecutionTest
        fields = ['statut', 'started_at', 'ended_at', 'projet_nom', 'numero_ticket_redmine']
        
        

# core/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import Permission
from .models import GroupePersonnalise

class GroupePersonnaliseSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(
        many=True,
        slug_field='codename',
        queryset=Permission.objects.all()
    )

    class Meta:
        model = GroupePersonnalise
        fields = [
            'id',
            'nom',
            'type_groupe',
            'role_predefini',
            'description',
            'permissions',
            'est_protege'
        ]
        read_only_fields = ['est_protege']  # On empêche la modification côté frontend pour les groupes protégés


