from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Customer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Customer
        fields = ['first_name', 'last_name', 'email', 'phone', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data.get('email', '')
        user = Customer(username=email or validated_data.get('phone', ''), **validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        try:
            user = Customer.objects.get(email=data['email'])
        except Customer.DoesNotExist:
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        user = authenticate(username=user.username, password=data['password'])
        if not user:
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        data['user'] = user
        return data


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'default_address']
        read_only_fields = ['id', 'email']
