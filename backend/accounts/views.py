from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, LoginSerializer, CustomerProfileSerializer, ChangePasswordSerializer


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class ContactRateThrottle(AnonRateThrottle):
    scope = 'contact'


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'user': CustomerProfileSerializer(user, context={'request': request}).data, **get_tokens(user)}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@throttle_classes([LoginRateThrottle])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        return Response({'user': CustomerProfileSerializer(user, context={'request': request}).data, **get_tokens(user)})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(CustomerProfileSerializer(request.user, context={'request': request}).data)
    serializer = CustomerProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(CustomerProfileSerializer(request.user, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
