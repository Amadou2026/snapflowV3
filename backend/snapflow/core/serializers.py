from django.utils import timezone
from datetime import timedelta
import datetime  # Pour le timezone si nécessaire
from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model
from .models import (
    CustomUser, ExecutionResult, Societe, SecteurActivite, GroupePersonnalise,
    Axe, SousAxe, Script, Projet, EmailNotification, 
    ConfigurationTest, ExecutionTest,Configuration
)
from django.db import models

User = get_user_model()

# === SERIALIZERS DE BASE (sans dépendances circulaires) ===

class SecteurActiviteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecteurActivite
        fields = ['id', 'nom']

class SocieteLightSerializer(serializers.ModelSerializer):
    """Serializer léger pour éviter les circularités"""
    class Meta:
        model = Societe
        fields = ['id', 'nom']

class ProjetLightSerializer(serializers.ModelSerializer):
    """Version basique pour éviter les circularités"""
    class Meta:
        model = Projet
        fields = ['id', 'nom', 'logo']

# === SERIALIZERS UTILISATEURS ===

class CustomUserSerializer(serializers.ModelSerializer):
    societes = serializers.SerializerMethodField()
    
    societe = serializers.PrimaryKeyRelatedField(
        queryset=Societe.objects.all(),
        required=True,
        allow_null=False,
        error_messages={
            'required': 'La société est obligatoire.',
            'null': 'La société ne peut pas être nulle.'
        }
    )
    
    groupes = serializers.SerializerMethodField(read_only=True)
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False
    )

    password = serializers.CharField(
        write_only=True, 
        required=True,
        min_length=8,
        error_messages={
            'min_length': 'Le mot de passe doit contenir au moins 8 caractères.',
            'required': 'Le mot de passe est obligatoire.'
        }
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'is_superuser', 'is_staff', 'is_active',
            'societe', 'societes', 'groupes', 'groups', 'password', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def get_societes(self, obj):
        """Retourne les données de sérialisation de la société de l'utilisateur"""
        try:
            if obj.societe:
                return SocieteLightSerializer(obj.societe).data
        except CustomUser.societe.RelatedObjectDoesNotExist:
            pass
        return None

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

    def validate(self, attrs):
        if not attrs.get('societe'):
            raise serializers.ValidationError({
                'societe': 'La société est obligatoire.'
            })
        return attrs

    def create(self, validated_data):
        request_user = self.context['request'].user

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

# === SERIALIZERS PROJETS ===

class ProjetSerializer(serializers.ModelSerializer):
    charge_de_compte_nom = serializers.SerializerMethodField()
    charge_de_compte_email = serializers.SerializerMethodField()
    societes = SocieteLightSerializer(many=True, read_only=True)
    nombre_societes = serializers.ReadOnlyField()
    
    class Meta:
        model = Projet
        fields = [
            'id', 'nom', 'id_redmine', 'url', 'logo', 'contrat',
            'charge_de_compte', 'charge_de_compte_nom', 'charge_de_compte_email',
            'id_redmine_charge_de_compte', 'societes', 'nombre_societes'
        ]
    
    def get_charge_de_compte_nom(self, obj):
        if obj.charge_de_compte:
            return f"{obj.charge_de_compte.first_name} {obj.charge_de_compte.last_name}"
        return None
    
    def get_charge_de_compte_email(self, obj):
        if obj.charge_de_compte:
            return obj.charge_de_compte.email
        return None

# === SERIALIZERS SOCIETES ===

class SocieteSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin = serializers.SerializerMethodField()
    employes = serializers.SerializerMethodField()
    projets = ProjetLightSerializer(many=True, read_only=True)
    nombre_projets = serializers.ReadOnlyField()
    nombre_employes = serializers.ReadOnlyField(source='employes.count')
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url',
            'secteur_activite', 'admin', 'projets', 'employes', 
            'nombre_projets', 'nombre_employes'
        ]
    
    def get_admin(self, obj):
        if obj.admin:
            return {
                'id': obj.admin.id,
                'full_name': obj.admin.get_full_name(),
                'email': obj.admin.email
            }
        return None

    def get_employes(self, obj):
        return [
            {
                'id': e.id,
                'full_name': e.get_full_name(),
                'email': e.email
            } for e in obj.employes.all()
        ]

# serializers.py

# === SERIALIZERS SOCIETES ===

class SocieteSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin = serializers.SerializerMethodField()
    employes = serializers.SerializerMethodField()
    projets = ProjetLightSerializer(many=True, read_only=True)
    nombre_projets = serializers.ReadOnlyField()
    nombre_employes = serializers.ReadOnlyField(source='employes.count')
    
    class Meta:
        model = Societe
        # --- MODIFIÉ : Suppression de 'num_siret' et 'url' ---
        fields = [
            'id', 'nom', 'secteur_activite', 'admin', 'projets', 'employes', 
            'nombre_projets', 'nombre_employes'
        ]
        # --- FIN DE LA MODIFICATION ---
    
    def get_admin(self, obj):
        if obj.admin:
            return {
                'id': obj.admin.id,
                'full_name': obj.admin.get_full_name(),
                'email': obj.admin.email
            }
        return None

    def get_employes(self, obj):
        return [
            {
                'id': e.id,
                'full_name': e.get_full_name(),
                'email': e.email
            } for e in obj.employes.all()
        ]
# Societe serializers
class SocieteListSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin_nom = serializers.CharField(source='admin.get_full_name', read_only=True)
    nombre_projets = serializers.ReadOnlyField()
    nombre_employes = serializers.ReadOnlyField(source='employes.count')
    
    class Meta:
        model = Societe
        # --- MODIFIÉ : Suppression de 'num_siret' et 'url' ---
        fields = [
            'id', 'nom', 'secteur_activite',
            'admin_nom', 'nombre_projets', 'nombre_employes'
        ]
        # --- FIN DE LA MODIFICATION ---

class SocieteDetailSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin = serializers.SerializerMethodField()
    employes = serializers.SerializerMethodField()
    projets = ProjetSerializer(many=True, read_only=True)
    nombre_projets = serializers.ReadOnlyField()
    nombre_employes = serializers.ReadOnlyField(source='employes.count')
    
    date_creation = serializers.DateTimeField(read_only=True)
    date_modification = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Societe
        # --- MODIFIÉ : Suppression de 'num_siret' et 'url' ---
        fields = [
            'id', 'nom', 'secteur_activite', 'admin', 'projets', 'employes',
            'nombre_projets', 'nombre_employes', 'date_creation', 'date_modification'
        ]
        # --- FIN DE LA MODIFICATION ---
    
    def get_admin(self, obj):
        if obj.admin:
            return {
                'id': obj.admin.id,
                'full_name': obj.admin.get_full_name(),
                'email': obj.admin.email
            }
        return None

    def get_employes(self, obj):
        return [
            {
                'id': e.id,
                'full_name': e.get_full_name(),
                'email': e.email
            } for e in obj.employes.all()
        ]

class SocieteCreateSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.PrimaryKeyRelatedField(
        queryset=SecteurActivite.objects.all(),
        required=False,
        allow_null=True
    )
    admin = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        required=False,
        allow_null=True
    )
    projets = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Societe
        # --- MODIFIÉ : Suppression de 'num_siret' et 'url' ---
        fields = [
            'id', 'nom', 'secteur_activite', 'admin', 'projets'
        ]
        # --- FIN DE LA MODIFICATION ---

    def create(self, validated_data):
        projets_data = validated_data.pop('projets', [])
        societe = Societe.objects.create(**validated_data)
        societe.projets.set(projets_data)
        return societe

class SocieteUpdateSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.PrimaryKeyRelatedField(
        queryset=SecteurActivite.objects.all(),
        required=False,
        allow_null=True
    )
    projets = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(),
        many=True,
        required=False
    )
    employes = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Societe
        # --- MODIFIÉ : Suppression de 'num_siret' et 'url' ---
        fields = [
            'id', 'nom', 'secteur_activite', 'projets', 'employes'
        ]
        # --- FIN DE LA MODIFICATION ---

    def update(self, instance, validated_data):
        projets_data = validated_data.pop('projets', None)
        employes_data = validated_data.pop('employes', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if projets_data is not None:
            instance.projets.set(projets_data)
        
        if employes_data is not None:
            instance.employes.set(employes_data)
        
        return instance

# === AUTRES SERIALIZERS ===

class AxeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Axe
        fields = '__all__'

class SousAxeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SousAxe
        fields = '__all__'

class ScriptSerializer(serializers.ModelSerializer):
    # Ajouter les noms des relations
    axe_nom = serializers.CharField(source='axe.nom', read_only=True)
    sous_axe_nom = serializers.CharField(source='sous_axe.nom', read_only=True)
    priorite_nom = serializers.CharField(source='get_priorite_display', read_only=True)
    
    class Meta:
        model = Script
        fields = [
            'id', 'nom', 'fichier', 
            'axe', 'axe_nom', 
            'sous_axe', 'sous_axe_nom',
            'projet', 'priorite', 'priorite_nom'
        ]



class EmailNotificationSerializer(serializers.ModelSerializer):
    # CHAMPS EXISTANTS
    societe_nom = serializers.CharField(source='societe.nom', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # NOUVEAUX CHAMPS
    nom_complet = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EmailNotification
        # MODIFIÉ : Ajout de 'prenom', 'nom' et 'nom_complet'
        fields = [
            'id', 'email', 'prenom', 'nom', 'nom_complet', 'societe', 'societe_nom', 
            'created_by', 'created_by_name', 'est_actif', 'date_creation'
        ]
        read_only_fields = ['created_by', 'date_creation']

    # NOUVEAU : Méthode pour calculer le nom complet
    def get_nom_complet(self, obj):
        if obj.prenom or obj.nom:
            return f"{obj.prenom or ''} {obj.nom or ''}".strip()
        return None

    def get_statut_display(self, obj):
        return "Actif" if obj.est_actif else "Inactif"
    
    def validate(self, data):
        # Validation pour s'assurer que l'email n'existe pas déjà pour cette société
        email = data.get('email')
        societe = data.get('societe')
        
        if self.instance:  # Si c'est une modification
            existing = EmailNotification.objects.filter(
                email=email, 
                societe=societe
            ).exclude(pk=self.instance.pk)
        else:  # Si c'est une création
            existing = EmailNotification.objects.filter(email=email, societe=societe)
        
        if existing.exists():
            raise serializers.ValidationError({
                'email': 'Cet email est déjà enregistré pour cette société.'
            })
        
        return data

    def validate_societe(self, value):
        user = self.context['request'].user
        if not user.is_superuser and value.admin != user:
            raise serializers.ValidationError("Vous ne pouvez pas assigner d'email à cette société.")
        return value

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
# 
        
class ConfigurationTestSerializer(serializers.ModelSerializer):
    societe = SocieteSerializer(read_only=True)
    projet = ProjetSerializer(read_only=True)
    
    # Champs calculés
    scripts_count = serializers.SerializerMethodField()
    emails_count = serializers.SerializerMethodField()
    next_execution = serializers.SerializerMethodField()
    
    # Pour l'écriture, garder les IDs
    societe_id = serializers.PrimaryKeyRelatedField(
        queryset=Societe.objects.all(), 
        source='societe', 
        write_only=True,
        required=False,
        allow_null=True
    )
    projet_id = serializers.PrimaryKeyRelatedField(
        queryset=Projet.objects.all(), 
        source='projet', 
        write_only=True,
        required=True
    )
    
    # Détails des relations ManyToMany
    scripts_details = ScriptSerializer(many=True, read_only=True, source='scripts')
    emails_notification_details = EmailNotificationSerializer(many=True, read_only=True, source='emails_notification')
    
    class Meta:
        model = ConfigurationTest
        fields = [
            'id', 
            'societe', 'societe_id',
            'nom', 
            'projet', 'projet_id',
            'scripts', 'scripts_details', 
            'emails_notification', 'emails_notification_details',
            'periodicite', 'last_execution', 'is_active', 
            'date_activation', 'date_desactivation', 
            'date_creation', 'date_modification',
            'scripts_count', 'emails_count', 'next_execution'
        ]
        read_only_fields = ['date_creation', 'date_modification', 'societe', 'projet']

    def get_scripts_count(self, obj):
        if isinstance(obj, dict):
            scripts_data = obj.get('scripts', [])
            return len(scripts_data) if scripts_data else 0
        return obj.scripts.count()

    def get_emails_count(self, obj):
        if isinstance(obj, dict):
            emails_data = obj.get('emails_notification', [])
            return len(emails_data) if emails_data else 0
        return obj.emails_notification.count()

    def get_next_execution(self, obj):
        if isinstance(obj, dict):
            return None
        next_exec = obj.get_next_execution_time()
        return next_exec.isoformat() if next_exec else None

    def validate(self, data):
        user = self.context['request'].user
        
        print("Données reçues dans validate:", data)
        
        # Validation de la société pour les non-superadmins
        if not user.is_superuser:
            if hasattr(user, 'societe') and user.societe:
                data['societe'] = user.societe
            else:
                raise serializers.ValidationError("Vous n'êtes associé à aucune société.")
        else:
            if 'societe' not in data or not data['societe']:
                raise serializers.ValidationError({"societe": "La société est requise pour les superadmins."})
        
        # Validation que le projet appartient à la société
        if data.get('projet') and data.get('societe'):
            if not data['projet'].societes.filter(id=data['societe'].id).exists():
                raise serializers.ValidationError({
                    "projet": "Le projet sélectionné n'appartient pas à votre société."
                })
        
        # Validation des dates
        date_activation = data.get('date_activation')
        date_desactivation = data.get('date_desactivation')
        
        if date_activation and date_desactivation and date_desactivation <= date_activation:
            raise serializers.ValidationError({
                "date_desactivation": "La date de désactivation doit être après la date d'activation."
            })
        
        return data

    def create(self, validated_data):
        """Méthode CORRECTE pour un Serializer"""
        print("CREATE SERIALIZER APPELÉ")
        print(f"validated_data: {validated_data}")
        
        try:
            # Extraire les relations ManyToMany
            scripts_data = validated_data.pop('scripts', [])
            emails_notification_data = validated_data.pop('emails_notification', [])
            
            print(f"Scripts à ajouter: {scripts_data}")
            print(f"Emails à ajouter: {emails_notification_data}")
            
            # Créer l'instance
            instance = ConfigurationTest.objects.create(**validated_data)
            print(f"Instance créée avec ID: {instance.id}")
            
            # Ajouter les relations ManyToMany
            if scripts_data:
                instance.scripts.set(scripts_data)
                print(f"{len(scripts_data)} scripts ajoutés")
            
            if emails_notification_data:
                instance.emails_notification.set(emails_notification_data)
                print(f"{len(emails_notification_data)} emails ajoutés")
            
            # Vérification finale
            instance.refresh_from_db()
            print(f"Configuration finale:")
            print(f"   - ID: {instance.id}")
            print(f"   - Nom: {instance.nom}")
            print(f"   - Active: {instance.is_active}")
            print(f"   - Scripts: {instance.scripts.count()}")
            print(f"   - Emails: {instance.emails_notification.count()}")
            
            return instance
            
        except Exception as e:
            print(f"❌ ERREUR dans create: {str(e)}")
            import traceback
            print(f"📋 STACK TRACE: {traceback.format_exc()}")
            raise serializers.ValidationError(f"Erreur création: {str(e)}")

    def update(self, instance, validated_data):
        print("🔍 Début update - validated_data:", validated_data)
        
        # Gérer les relations ManyToMany séparément
        scripts_data = validated_data.pop('scripts', None)
        emails_notification_data = validated_data.pop('emails_notification', None)
        
        # Mettre à jour les champs standards
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Sauvegarder l'instance
        instance.save()
        
        # Mettre à jour les relations ManyToMany si fournies
        if scripts_data is not None:
            instance.scripts.set(scripts_data)
        
        if emails_notification_data is not None:
            instance.emails_notification.set(emails_notification_data)
        
        print("✅ Update terminé avec succès")
        return instance

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        if isinstance(instance, ConfigurationTest):
            representation['scripts_count'] = instance.scripts.count()
            representation['emails_count'] = instance.emails_notification.count()
            next_exec = instance.get_next_execution_time()
            representation['next_execution'] = next_exec.isoformat() if next_exec else None
        
        return representation

class ExecutionTestSerializer(serializers.ModelSerializer):
    # CORRECTION: Ajouter les champs de relation
    configuration_nom = serializers.CharField(source='configuration.nom', read_only=True)
    projet_nom = serializers.CharField(source='configuration.projet.nom', read_only=True)
    societe_nom = serializers.CharField(source='configuration.societe.nom', read_only=True)
    
    # Détails complets de la configuration (optionnel)
    configuration_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ExecutionTest
        fields = [
            'id',
            'configuration',  # ID de la configuration
            'configuration_nom',  # Nom de la configuration
            'projet_nom',  # Nom du projet
            'societe_nom',  # Nom de la société
            'configuration_details',  # Détails complets (optionnel)
            'statut',
            'started_at',
            'ended_at',
            'log_fichier',
            'rapport',
            'ticket_redmine_id'
        ]

    def get_configuration_details(self, obj):
        # Retourner des détails supplémentaires si besoin
        if obj.configuration:
            return {
                'id': obj.configuration.id,
                'nom': obj.configuration.nom,
                'periodicite': obj.configuration.periodicite,
                'is_active': obj.configuration.is_active
            }
        return None

class ExecutionTestExportSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source='configuration.projet.nom', read_only=True)

    class Meta:
        model = ExecutionTest
        fields = ['statut', 'started_at', 'ended_at', 'projet_nom', 'numero_ticket_redmine']

class GroupePersonnaliseSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all()
    )
    
    role_predefini = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    
    # Ajout d'un champ pour afficher le nom complet du rôle
    role_display = serializers.CharField(source='get_role_predefini_display', read_only=True)

    class Meta:
        model = GroupePersonnalise
        fields = [
            'id',
            'nom',
            'type_groupe',
            'role_predefini',
            'role_display',
            'description',
            'permissions',
            'est_protege'
        ]
        read_only_fields = ['est_protege']
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['permissions'] = [
            f"{perm.content_type.app_label}.{perm.codename}" 
            for perm in instance.permissions.all()
        ]
        return representation
    
    def validate_role_predefini(self, value):
        # Validation pour s'assurer que le rôle prédéfini est valide
        if value and value not in dict(self.Meta.model.ROLE_PREDEFINIS):
            raise serializers.ValidationError("Rôle prédéfini invalide")
        return value

    # Paramètres
class ConfigurationSerializer(serializers.ModelSerializer):
    societe_nom = serializers.CharField(source='societe.nom', read_only=True)
    
    class Meta:
        model = Configuration
        fields = [
            'id', 'societe', 'societe_nom', 'redmine_url', 'redmine_api_key',
            'email_host_user', 'email_host_password', 'last_sync',
            'date_creation', 'date_modification'
        ]
        read_only_fields = ['last_sync', 'date_creation', 'date_modification']

    def validate_societe(self, value):
        user = self.context['request'].user
        if not user.is_superuser and value.admin != user:
            raise serializers.ValidationError("Vous ne pouvez pas configurer cette société.")
        return value

    def create(self, validated_data):
        # S'assurer qu'une société n'a qu'une seule configuration
        societe = validated_data.get('societe')
        if Configuration.objects.filter(societe=societe).exists():
            raise serializers.ValidationError({"societe": "Cette société a déjà une configuration."})
        
        return super().create(validated_data)
    
# serializers.py
class ExecutionResultSerializer(serializers.ModelSerializer):
    script_nom = serializers.CharField(source='script.nom', read_only=True)
    configuration_nom = serializers.CharField(source='execution.configuration.nom', read_only=True)
    projet_nom = serializers.CharField(source='execution.configuration.projet.nom', read_only=True)
    started_at = serializers.DateTimeField(source='execution.started_at', read_only=True)
    execution_id = serializers.IntegerField(source='execution.id', read_only=True)

    class Meta:
        model = ExecutionResult
        fields = [
            'id', 'execution_id', 'script', 'script_nom', 'statut', 
            'log_fichier', 'commentaire', 'configuration_nom', 
            'projet_nom', 'started_at'
        ]
        
#

class ProjetDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un projet avec toutes ses données"""
    charge_de_compte = CustomUserSerializer(read_only=True)
    societes = SocieteListSerializer(many=True, read_only=True)
    nombre_societes = serializers.ReadOnlyField()
    
    # Configurations de test
    configurations_test = serializers.SerializerMethodField()
    configurations_actives = serializers.SerializerMethodField()
    
    # Scripts
    scripts = ScriptSerializer(many=True, read_only=True)
    scripts_par_axe = serializers.SerializerMethodField()
    scripts_statistiques = serializers.SerializerMethodField()
    
    # Statistiques avancées
    statistiques = serializers.SerializerMethodField()
    statistiques_avancees = serializers.SerializerMethodField()
    
    # Exécutions
    dernieres_executions = serializers.SerializerMethodField()
    prochaines_executions = serializers.SerializerMethodField()
    executions_par_statut = serializers.SerializerMethodField()
    
    # Informations temporelles
    activite_recente = serializers.SerializerMethodField()
    tendances = serializers.SerializerMethodField()

    class Meta:
        model = Projet
        fields = [
            'id', 'id_redmine', 'nom', 'url', 'logo', 'contrat',
            'charge_de_compte', 'id_redmine_charge_de_compte',
            'societes', 'nombre_societes',
            'configurations_test', 'configurations_actives',
            'scripts', 'scripts_par_axe', 'scripts_statistiques',
            'statistiques', 'statistiques_avancees',
            'dernieres_executions', 'prochaines_executions', 'executions_par_statut',
            'activite_recente', 'tendances'
        ]

    def get_configurations_test(self, obj):
        """Récupérer toutes les configurations de test du projet avec plus de détails"""
        configurations = ConfigurationTest.objects.filter(projet=obj).select_related(
            'societe'
        ).prefetch_related('scripts', 'emails_notification')
        
        return ConfigurationTestDetailSerializer(configurations, many=True).data

    def get_configurations_actives(self, obj):
        """Récupérer les configurations actives avec détails"""
        configurations = ConfigurationTest.objects.filter(
            projet=obj, 
            is_active=True
        ).select_related('societe').prefetch_related('scripts')
        
        return ConfigurationTestListSerializer(configurations, many=True).data

    def get_scripts_par_axe(self, obj):
        """Organiser les scripts par axe/sous-axe avec plus de détails"""
        scripts = obj.scripts.all().select_related('axe', 'sous_axe')
        result = {}
        
        for script in scripts:
            axe_nom = script.axe.nom if script.axe else "Non classé"
            sous_axe_nom = script.sous_axe.nom if script.sous_axe else "Non classé"
            
            if axe_nom not in result:
                result[axe_nom] = {
                    'id': script.axe.id if script.axe else None,
                    'description': script.axe.description if script.axe else "",
                    'sous_axes': {}
                }
            
            if sous_axe_nom not in result[axe_nom]['sous_axes']:
                result[axe_nom]['sous_axes'][sous_axe_nom] = {
                    'id': script.sous_axe.id if script.sous_axe else None,
                    'description': script.sous_axe.description if script.sous_axe else "",
                    'scripts': []
                }
            
            # Statistiques d'exécution pour ce script
            executions_script = ExecutionTest.objects.filter(
                configuration__scripts=script
            )
            total_executions = executions_script.count()
            reussites = executions_script.filter(statut='done').count()
            
            result[axe_nom]['sous_axes'][sous_axe_nom]['scripts'].append({
                'id': script.id,
                'nom': script.nom,
                'priorite': script.get_priorite_display(),
                'priorite_valeur': script.priorite,
                'fichier_url': script.fichier.url if script.fichier else None,
                'fichier_nom': script.fichier.name.split('/')[-1] if script.fichier else None,
                'total_executions': total_executions,
                'taux_reussite': round((reussites / total_executions * 100) if total_executions > 0 else 0, 2),
                'date_creation': script.fichier.created if hasattr(script.fichier, 'created') else None
            })
        
        return result

    def get_scripts_statistiques(self, obj):
        """Statistiques détaillées sur les scripts"""
        scripts = obj.scripts.all()
        executions = ExecutionTest.objects.filter(configuration__projet=obj)
        
        return {
            'total_scripts': scripts.count(),
            'par_priorite': {
                'basse': scripts.filter(priorite=1).count(),
                'normale': scripts.filter(priorite=2).count(),
                'haute': scripts.filter(priorite=3).count(),
                'urgente': scripts.filter(priorite=4).count(),
                'immediate': scripts.filter(priorite=5).count(),
            },
            'scripts_avec_executions': scripts.filter(
                id__in=executions.values('configuration__scripts')
            ).distinct().count(),
            'scripts_sans_executions': scripts.exclude(
                id__in=executions.values('configuration__scripts')
            ).count()
        }

    def get_statistiques(self, obj):
        """Calculer les statistiques de base du projet"""
        configurations = ConfigurationTest.objects.filter(projet=obj)
        executions = ExecutionTest.objects.filter(configuration__projet=obj)
        
        total_executions = executions.count()
        executions_reussies = executions.filter(statut='done').count()
        
        return {
            'total_configurations': configurations.count(),
            'configurations_actives': configurations.filter(is_active=True).count(),
            'total_scripts': obj.scripts.count(),
            'total_executions': total_executions,
            'executions_reussies': executions_reussies,
            'executions_echecs': executions.filter(statut='error').count(),
            'executions_en_cours': executions.filter(statut='running').count(),
            'executions_attente': executions.filter(statut='pending').count(),
            'societes_associees': obj.societes.count(),
            'taux_reussite': round(
                (executions_reussies / total_executions * 100) 
                if total_executions > 0 else 0, 
                2
            )
        }

    def get_statistiques_avancees(self, obj):
        """Statistiques avancées avec analyse temporelle"""
        executions = ExecutionTest.objects.filter(configuration__projet=obj)
        
        # CORRECTION: Utiliser timezone du module django.utils
        trente_jours = timezone.now() - timedelta(days=30)
        executions_30j = executions.filter(started_at__gte=trente_jours)
        
        # Temps moyen d'exécution
        durees = []
        for exec in executions.filter(ended_at__isnull=False, started_at__isnull=False):
            duree = exec.ended_at - exec.started_at
            durees.append(duree.total_seconds())
        
        duree_moyenne = sum(durees) / len(durees) if durees else 0
        
        return {
            'executions_30j': executions_30j.count(),
            'taux_reussite_30j': round(
                (executions_30j.filter(statut='done').count() / executions_30j.count() * 100)
                if executions_30j.count() > 0 else 0, 2
            ),
            'duree_moyenne_execution': round(duree_moyenne / 60, 2),  # en minutes
            'configurations_avec_erreurs': ConfigurationTest.objects.filter(
                projet=obj,
                executiontest__statut='error'
            ).distinct().count(),
            'scripts_plus_utilises': self._get_scripts_plus_utilises(obj)
        }

    def _get_scripts_plus_utilises(self, obj):
        """Retourne les scripts les plus utilisés dans les configurations"""
        from django.db.models import Count
        
        scripts = obj.scripts.annotate(
            nb_configurations=Count('configurationtest')
        ).order_by('-nb_configurations')[:5]
        
        return [
            {
                'id': script.id,
                'nom': script.nom,
                'nb_configurations': script.nb_configurations,
                'axe': script.axe.nom if script.axe else "Non classé"
            }
            for script in scripts
        ]

    def get_dernieres_executions(self, obj):
        """Récupérer les 15 dernières exécutions avec plus de détails"""
        executions = ExecutionTest.objects.filter(
            configuration__projet=obj
        ).select_related('configuration', 'configuration__societe').order_by('-started_at')[:15]
        
        return ExecutionTestDetailSerializer(executions, many=True).data

    def get_prochaines_executions(self, obj):
        """Récupérer les prochaines exécutions programmées avec plus de détails"""
        configurations_actives = ConfigurationTest.objects.filter(
            projet=obj, 
            is_active=True
        ).select_related('societe').prefetch_related('scripts')
        
        prochaines = []
        
        for config in configurations_actives:
            next_exec = config.get_next_execution_time()
            if next_exec:
                # CORRECTION: Utiliser timezone.now()
                time_until = next_exec - timezone.now()
                
                prochaines.append({
                    'configuration_id': config.id,
                    'configuration_nom': config.nom,
                    'societe_id': config.societe.id,
                    'societe_nom': config.societe.nom,
                    'next_execution': next_exec,
                    'scripts_count': config.scripts.count(),
                    'periodicite': config.get_periodicite_display(),
                    'time_until_execution': str(time_until).split('.')[0] if time_until else "N/A"
                })
        
        # Trier par date
        prochaines.sort(key=lambda x: x['next_execution'])
        return prochaines[:10]  # Retourner les 10 prochaines

    def get_executions_par_statut(self, obj):
        """Répartition des exécutions par statut"""
        executions = ExecutionTest.objects.filter(configuration__projet=obj)
        
        # Méthode 1: Calcul simple sans Window (recommandé)
        total = executions.count()
        statuts = executions.values('statut').annotate(
            count=models.Count('id')
        )
        
        result = {}
        for statut in statuts:
            count = statut['count']
            result[statut['statut']] = {
                'count': count,
                'pourcentage': round((count / total * 100), 2) if total > 0 else 0,
                'label': dict(ExecutionTest.STATUS_CHOICES).get(statut['statut'], statut['statut'])
            }
        
        return result

    def get_activite_recente(self, obj):
        """Activité récente du projet (7 derniers jours)"""
        # CORRECTION: Utiliser timezone du module django.utils
        sept_jours = timezone.now() - timedelta(days=7)
        
        executions_recentes = ExecutionTest.objects.filter(
            configuration__projet=obj,
            started_at__gte=sept_jours
        )
        
        derniere_execution = executions_recentes.order_by('-started_at').first()
        
        return {
            'executions_total_7j': executions_recentes.count(),
            'executions_reussies_7j': executions_recentes.filter(statut='done').count(),
            'executions_echouees_7j': executions_recentes.filter(statut='error').count(),
            'derniere_execution': derniere_execution.started_at if derniere_execution else None,
            'configurations_actives_7j': ConfigurationTest.objects.filter(
                projet=obj,
                is_active=True,
                date_creation__gte=sept_jours
            ).count()
        }

    def get_tendances(self, obj):
        """Tendances sur les 30 derniers jours"""
        tendances = []
        # CORRECTION: Utiliser timezone.now() pour la date d'aujourd'hui
        aujourd_hui = timezone.now().date()
        
        for i in range(30, -1, -1):
            date = aujourd_hui - timedelta(days=i)
            executions_jour = ExecutionTest.objects.filter(
                configuration__projet=obj,
                started_at__date=date
            )
            
            tendances.append({
                'date': date,
                'total': executions_jour.count(),
                'reussites': executions_jour.filter(statut='done').count(),
                'echecs': executions_jour.filter(statut='error').count()
            })
        
        return tendances

class ConfigurationTestDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les configurations de test"""
    societe = SocieteListSerializer(read_only=True)
    scripts = ScriptSerializer(many=True, read_only=True)
    emails_notification = serializers.SerializerMethodField()
    prochaine_execution = serializers.SerializerMethodField()
    derniere_execution_info = serializers.SerializerMethodField()
    
    class Meta:
        model = ConfigurationTest
        fields = [
            'id', 'nom', 'societe', 'scripts', 'periodicite', 'is_active',
            'last_execution', 'date_activation', 'date_desactivation',
            'emails_notification', 'prochaine_execution', 'derniere_execution_info',
            'date_creation', 'date_modification'
        ]
    
    def get_emails_notification(self, obj):
        return list(obj.emails_notification.filter(est_actif=True).values_list('email', flat=True))
    
    def get_prochaine_execution(self, obj):
        return obj.get_next_execution_time()
    
    def get_derniere_execution_info(self, obj):
        derniere_exec = ExecutionTest.objects.filter(configuration=obj).order_by('-started_at').first()
        if derniere_exec:
            return {
                'id': derniere_exec.id,
                'statut': derniere_exec.statut,
                'started_at': derniere_exec.started_at,
                'ended_at': derniere_exec.ended_at,
                'duree': str(derniere_exec.ended_at - derniere_exec.started_at).split('.')[0] if derniere_exec.ended_at and derniere_exec.started_at else None
            }
        return None

class ExecutionTestDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les exécutions de test"""
    configuration_nom = serializers.CharField(source='configuration.nom', read_only=True)
    societe_nom = serializers.CharField(source='configuration.societe.nom', read_only=True)
    duree = serializers.SerializerMethodField()
    scripts_executes = serializers.SerializerMethodField()
    
    class Meta:
        model = ExecutionTest
        fields = [
            'id', 'configuration', 'configuration_nom', 'societe_nom',
            'statut', 'started_at', 'ended_at', 'duree',
            'log_fichier', 'rapport', 'ticket_redmine_id', 'scripts_executes'
        ]
    
    def get_duree(self, obj):
        if obj.ended_at and obj.started_at:
            return str(obj.ended_at - obj.started_at).split('.')[0]
        return None
    
    def get_scripts_executes(self, obj):
        resultats = ExecutionResult.objects.filter(execution=obj).select_related('script')
        return [
            {
                'script_id': res.script.id,
                'script_nom': res.script.nom,
                'statut': res.statut,
                'commentaire': res.commentaire
            }
            for res in resultats
        ]
#    
        

    
class ConfigurationTestListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes de configurations"""
    societe = serializers.StringRelatedField()
    scripts_count = serializers.SerializerMethodField()
    last_execution_status = serializers.SerializerMethodField()

    class Meta:
        model = ConfigurationTest
        fields = [
            'id', 'nom', 'societe', 'periodicite', 'is_active',
            'last_execution', 'scripts_count', 'last_execution_status'
        ]

    def get_scripts_count(self, obj):
        return obj.scripts.count()

    def get_last_execution_status(self, obj):
        last_execution = ExecutionTest.objects.filter(
            configuration=obj
        ).order_by('-started_at').first()
        return last_execution.statut if last_execution else None

class ExecutionTestListSerializer(serializers.ModelSerializer):
    """Serializer léger pour les listes d'exécutions"""
    configuration_nom = serializers.CharField(source='configuration.nom', read_only=True)
    duree = serializers.SerializerMethodField()

    class Meta:
        model = ExecutionTest
        fields = [
            'id', 'configuration_nom', 'statut', 'started_at', 'ended_at',
            'duree', 'ticket_redmine_id'
        ]

    def get_duree(self, obj):
        if obj.started_at and obj.ended_at:
            return obj.ended_at - obj.started_at
        return None
    
# Script à probleme 
from rest_framework import serializers
from .models import ProblemeScript, Script, Projet, Societe

class ProblemeScriptSerializer(serializers.ModelSerializer):
    projet_nom = serializers.CharField(source='script.projet.nom', read_only=True)
    projet_id = serializers.IntegerField(source='script.projet.id', read_only=True)
    societe_nom = serializers.CharField(source='script.projet.societes.first.nom', read_only=True)
    societe_id = serializers.IntegerField(source='script.projet.societes.first.id', read_only=True)
    
    class Meta:
        model = ProblemeScript
        fields = [
            'id', 'script', 'type_probleme', 'description', 'frequence_probleme',
            'derniere_execution', 'statut', 'date_creation', 'date_modification',
            'projet_nom', 'projet_id', 'societe_nom', 'societe_id'
        ]
        read_only_fields = ['date_creation', 'date_modification']
        
# core/serializers.py


from .models import RedmineProject

class RedmineProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = RedmineProject
        fields = [
            'project_id', 
            'name', 
            'identifier', 
            'description', 
            'homepage', 
            'parent_name', 
            'status', 
            'is_public'
        ]