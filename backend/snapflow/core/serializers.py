from rest_framework import serializers
from .models import *

class SocieteSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin = serializers.SerializerMethodField()
    employes = serializers.SerializerMethodField()
    projet = serializers.SerializerMethodField()
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url',
            'secteur_activite', 'admin', 'projet', 'employes'
        ]
    
    def get_admin(self, obj):
        return obj.admin.get_full_name() if obj.admin else None

    def get_employes(self, obj):
        return [e.get_full_name() for e in obj.employes.all()]
    
    def get_projet(self, obj):
        return obj.projet.nom if obj.projet else None

class SocieteUpdateSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.PrimaryKeyRelatedField(
        queryset=SecteurActivite.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url', 'secteur_activite'
        ]

class SocieteCreateSerializer(serializers.ModelSerializer):
    # Pour la création, utilisez des PrimaryKeyRelatedField
    secteur_activite = serializers.PrimaryKeyRelatedField(
        queryset=SecteurActivite.objects.all()
    )
    admin = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        required=False,  # Si l'admin peut être optionnel
        allow_null=True
    )
    projet = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(),  # Remplacez par votre modèle Projet
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url',
            'secteur_activite', 'admin', 'projet'
            # 'employes' n'est pas inclus car c'est probablement une relation ManyToMany
        ]

# Secteur Activité Serializer
class SecteurActiviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecteurActivite
        fields = ['id', 'nom']



    
from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import CustomUser, Societe, GroupePersonnalise
from .serializers import SocieteSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    # 🔹 On remplace la source read_only par un SerializerMethodField
    societes = serializers.SerializerMethodField()
    
    # Ajout du champ societe (en écriture)
    societe = serializers.PrimaryKeyRelatedField(
        queryset=Societe.objects.all(),
        required=False,
        allow_null=True
    )
    
    groupes = serializers.SerializerMethodField(read_only=True)
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False
    )

    # 🔹 Champ mot de passe en écriture uniquement
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'is_superuser', 'is_staff', 'is_active',
            'societe', 'societes', 'groupes', 'groups', 'password', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']

    # 🔹 Méthode pour renvoyer les sociétés
    def get_societes(self, obj):
        if obj.societe:
            return SocieteSerializer([obj.societe], many=True).data
        return []

    # 🔹 Méthode pour renvoyer les groupes
    def get_groupes(self, obj):
        result = []
        for g in obj.groups.all():
            try:
                gp = g.groupe_personnalise
                result.append({
                    'id': g.id,
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

    # 🔹 Création d'un nouvel utilisateur
    def create(self, validated_data):
        request_user = self.context['request'].user

        # Si l'utilisateur n'est pas superadmin, il ne peut pas choisir la société
        if not request_user.is_superuser and request_user.societe:
            validated_data['societe'] = request_user.societe

        password = validated_data.pop("password")
        groups = validated_data.pop("groups", [])

        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        if groups:
            user.groups.set(groups)

        if user.societe:
            user.societe.employes.add(user)

        return user

    # 🔹 Mise à jour d'un utilisateur existant
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        groups = validated_data.pop("groups", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        if instance.societe:
            instance.societe.employes.add(instance)

        return instance


    




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
    # Utiliser PrimaryKeyRelatedField pour accepter les IDs
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all()
    )
    
    role_predefini = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
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
        read_only_fields = ['est_protege']
    
    def to_representation(self, instance):
        """Pour l'affichage, retourner les codenames au lieu des IDs"""
        representation = super().to_representation(instance)
        representation['permissions'] = [
            f"{perm.content_type.app_label}.{perm.codename}" 
            for perm in instance.permissions.all()
        ]
        return representation



