from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.serializers import (
    ChangePasswordSerializer,
    CustomerRegistrationSerializer,
    ProfileUpdateSerializer,
    UserSerializer,
)
from apps.accounts.services import issue_tokens


class CustomerRegisterView(APIView):
    """POST /api/auth/register/ — customer self-signup."""

    permission_classes = (AllowAny,)
    throttle_scope = "auth"

    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"user": UserSerializer(user).data, **issue_tokens(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — returns access/refresh plus the user profile."""

    permission_classes = (AllowAny,)
    throttle_scope = "auth"


class RefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)
    throttle_scope = "auth"


class MeView(RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ — the caller's own profile only."""

    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        return UserSerializer if self.request.method == "GET" else ProfileUpdateSerializer

    def update(self, request, *args, **kwargs):
        super().update(request, *args, **kwargs)
        return Response(UserSerializer(self.get_object()).data)


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully."})
