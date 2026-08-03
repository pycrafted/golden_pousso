from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Customer


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Customer
        fields = ['first_name', 'last_name', 'phone', 'password']

    def validate_phone(self, value):
        if Customer.objects.filter(phone=value).exists():
            raise serializers.ValidationError('Ce numéro est déjà associé à un compte.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        phone = validated_data['phone']
        user = Customer(
            username=phone,
            email=f"{phone}@goldenpousso.local",
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        try:
            user = Customer.objects.get(phone=data['phone'])
        except Customer.DoesNotExist:
            raise serializers.ValidationError('Numéro de téléphone ou mot de passe incorrect.')
        user = authenticate(username=user.username, password=data['password'])
        if not user:
            raise serializers.ValidationError('Numéro de téléphone ou mot de passe incorrect.')
        data['user'] = user
        return data


class CustomerProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'default_address', 'avatar', 'avatar_url', 'is_staff']
        read_only_fields = ['id', 'email', 'avatar_url', 'is_staff']
        extra_kwargs = {'avatar': {'required': False, 'write_only': True}}

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Mot de passe actuel incorrect.')
        return value
