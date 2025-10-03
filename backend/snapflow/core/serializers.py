from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model
from .models import (
    CustomUser, Societe, SecteurActivite, GroupePersonnalise,
    Axe, SousAxe, Script, Projet, EmailNotification, 
    ConfigurationTest, ExecutionTest,Configuration
)

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
        fields = ['id', 'nom', 'num_siret', 'url']

class ProjetLightSerializer(serializers.ModelSerializer):
    """Version basique pour éviter les circularités"""
    class Meta:
        model = Projet
        fields = ['id', 'nom', 'url', 'logo']

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

class SocieteListSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin_nom = serializers.CharField(source='admin.get_full_name', read_only=True)
    nombre_projets = serializers.ReadOnlyField()
    nombre_employes = serializers.ReadOnlyField(source='employes.count')
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url', 'secteur_activite',
            'admin_nom', 'nombre_projets', 'nombre_employes'
        ]

class SocieteDetailSerializer(serializers.ModelSerializer):
    secteur_activite = serializers.CharField(source='secteur_activite.nom', read_only=True)
    admin = serializers.SerializerMethodField()
    employes = serializers.SerializerMethodField()
    projets = ProjetSerializer(many=True, read_only=True)
    nombre_projets = serializers.ReadOnlyField()
    nombre_employes = serializers.ReadOnlyField(source='employes.count')
    
    # Version simplifiée - laisser Django gérer le format
    date_creation = serializers.DateTimeField(read_only=True)
    date_modification = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url',
            'secteur_activite', 'admin', 'projets', 'employes',
            'nombre_projets', 'nombre_employes', 'date_creation', 'date_modification'
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
        fields = [
            'id', 'nom', 'num_siret', 'url',
            'secteur_activite', 'admin', 'projets'
        ]

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
    employes = serializers.PrimaryKeyRelatedField(  # AJOUTEZ CE CHAMP
        queryset=CustomUser.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Societe
        fields = [
            'id', 'nom', 'num_siret', 'url', 'secteur_activite', 'projets', 'employes'  # AJOUTEZ 'employes'
        ]

    def update(self, instance, validated_data):
        # Extraire les données ManyToMany
        projets_data = validated_data.pop('projets', None)
        employes_data = validated_data.pop('employes', None)  # AJOUTEZ CETTE LIGNE
        
        # Mettre à jour les champs standards
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Mettre à jour les relations ManyToMany
        if projets_data is not None:
            instance.projets.set(projets_data)
        
        if employes_data is not None:  # AJOUTEZ CE BLOC
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
    societe_nom = serializers.CharField(source='societe.nom', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    statut = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = EmailNotification
        fields = [
            'id', 'email', 'societe', 'societe_nom', 'created_by', 
            'created_by_name', 'est_actif', 'statut', 'date_creation'
        ]
        read_only_fields = ['created_by', 'date_creation']

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
    
    # Pour l'écriture, garder les IDs - CORRECTION: required=True pour projet_id
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
        required=True  # CORRECTION: required=True
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
        return obj.scripts.count()

    def get_emails_count(self, obj):
        return obj.emails_notification.count()

    def get_next_execution(self, obj):
        next_exec = obj.get_next_execution_time()
        return next_exec.isoformat() if next_exec else None

    def validate(self, data):
        user = self.context['request'].user
        
        print("🔍 Données reçues dans validate:", data)
        
        # Validation de la société pour les non-superadmins
        if not user.is_superuser:
            if hasattr(user, 'societe') and user.societe:
                data['societe'] = user.societe
            else:
                raise serializers.ValidationError("Vous n'êtes associé à aucune société.")
        else:
            # Pour les superadmins, s'assurer qu'une société est fournie
            if 'societe' not in data or not data['societe']:
                raise serializers.ValidationError({"societe": "La société est requise pour les superadmins."})
        
        # Validation que le projet appartient à la société
        if data.get('projet') and data.get('societe'):
            # CORRECTION: Vérifier la relation ManyToMany
            if not data['projet'].societes.filter(id=data['societe'].id).exists():
                raise serializers.ValidationError({
                    "projet": "Le projet sélectionné n'appartient pas à votre société."
                })
        
        return data

    def update(self, instance, validated_data):
        print("🔍 Début update - validated_data:", validated_data)
        
        # Gérer les relations ManyToMany séparément
        scripts_data = validated_data.pop('scripts', None)
        emails_notification_data = validated_data.pop('emails_notification', None)
        
        # Mettre à jour les champs standards
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Mettre à jour les relations ManyToMany si fournies
        if scripts_data is not None:
            instance.scripts.set(scripts_data)
        
        if emails_notification_data is not None:
            instance.emails_notification.set(emails_notification_data)
        
        print("✅ Update terminé avec succès")
        return instance

    def create(self, validated_data):
        user = self.context['request'].user
        
        # Pour les non-superadmins, assigner automatiquement leur société
        if not user.is_superuser and hasattr(user, 'societe'):
            validated_data['societe'] = user.societe
        
        return super().create(validated_data)

class ExecutionTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExecutionTest
        fields = '__all__'

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
        representation = super().to_representation(instance)
        representation['permissions'] = [
            f"{perm.content_type.app_label}.{perm.codename}" 
            for perm in instance.permissions.all()
        ]
        return representation

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