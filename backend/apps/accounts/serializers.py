from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.constants import ROLE_HOME, Role
from apps.accounts.models import User
from apps.accounts.repositories import UserRepository
from apps.common.validators import validate_image_upload


class UserSerializer(serializers.ModelSerializer):
    home_path = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "name", "email", "phone", "role", "avatar",
            "is_active", "date_joined", "home_path",
        )
        read_only_fields = ("id", "email", "role", "is_active", "date_joined")

    def get_home_path(self, obj):
        return ROLE_HOME.get(obj.role, "/")


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "name", "email", "phone", "role")


class BaseRegistrationSerializer(serializers.Serializer):
    """Shared owner/account fields. Shopkeeper and delivery onboarding reuse this."""

    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=10)
    password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_email(self, value):
        value = value.lower().strip()
        if UserRepository.exists_by_email(value):
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_phone(self, value):
        value = value.strip()
        if UserRepository.exists_by_phone(value):
            raise serializers.ValidationError("An account with this mobile number already exists.")
        return value


class CustomerRegistrationSerializer(BaseRegistrationSerializer):
    """Self-service customer signup. Role is assigned by the server, never the client."""

    def create(self, validated_data):
        from apps.accounts.services import register_user

        return register_user(role=Role.CUSTOMER, **validated_data)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("name", "phone", "avatar")

    def validate_avatar(self, value):
        return validate_image_upload(value) if value else value

    def validate_phone(self, value):
        if UserRepository.exists_by_phone(value, exclude_id=self.instance.pk):
            raise serializers.ValidationError("This mobile number is already in use.")
        return value

    def update(self, instance, validated_data):
        from apps.accounts.services import update_profile

        return update_profile(instance, validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self, **kwargs):
        from apps.accounts.services import change_password

        user = self.context["request"].user
        return change_password(user, self.validated_data["new_password"])


class QuickCommerceTokenObtainSerializer(TokenObtainPairSerializer):
    """Adds the role claim to the JWT and returns the user profile with the tokens."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["name"] = user.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data
