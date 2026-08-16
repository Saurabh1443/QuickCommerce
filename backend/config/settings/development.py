"""Development settings."""

from .base import *

from .payments import *
from .notifications import *
from .events import *
from .logging import *


DEBUG = env_bool("DEBUG", True)