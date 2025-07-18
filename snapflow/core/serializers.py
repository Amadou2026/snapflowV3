from rest_framework import serializers
from .models import *

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name']


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
