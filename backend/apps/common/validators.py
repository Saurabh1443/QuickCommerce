from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

phone_validator = RegexValidator(
    regex=r"^[6-9]\d{9}$",
    message="Enter a valid 10-digit Indian mobile number.",
)

pincode_validator = RegexValidator(
    regex=r"^\d{6}$", message="Enter a valid 6-digit pincode."
)

gst_validator = RegexValidator(
    regex=r"^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
    message="Enter a valid GST number.",
)

pan_validator = RegexValidator(
    regex=r"^$|^[A-Z]{5}[0-9]{4}[A-Z]$", message="Enter a valid PAN number."
)

ifsc_validator = RegexValidator(
    regex=r"^$|^[A-Z]{4}0[A-Z0-9]{6}$", message="Enter a valid IFSC code."
)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_image_upload(file):
    """Guard uploads by size and extension; images land in ./backend/media."""
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if file.size > max_bytes:
        raise ValidationError(f"Image must be smaller than {settings.MAX_UPLOAD_SIZE_MB} MB.")
    name = getattr(file, "name", "") or ""
    if not any(name.lower().endswith(ext) for ext in ALLOWED_IMAGE_EXTENSIONS):
        raise ValidationError("Only JPG, PNG or WEBP images are allowed.")
    return file
