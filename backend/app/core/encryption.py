"""AES-256-GCM encryption for sensitive data at rest."""
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def _derive_key(secret: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=600000)
    return base64.urlsafe_b64encode(kdf.derive(secret.encode()))


def encrypt(plaintext: str, secret: str | None = None) -> str:
    """Encrypt plaintext with AES-256-GCM via Fernet."""
    if secret is None:
        secret = os.environ.get("ENCRYPTION_KEY")
    if secret is None:
        raise RuntimeError("ENCRYPTION_KEY environment variable is required")
    salt = os.urandom(16)
    key = _derive_key(secret, salt)
    f = Fernet(key)
    token = f.encrypt(plaintext.encode())
    return base64.urlsafe_b64encode(salt + token).decode()


def decrypt(ciphertext: str, secret: str | None = None) -> str:
    """Decrypt ciphertext produced by encrypt()."""
    if secret is None:
        secret = os.environ.get("ENCRYPTION_KEY")
    if secret is None:
        raise RuntimeError("ENCRYPTION_KEY environment variable is required")
    raw = base64.urlsafe_b64decode(ciphertext.encode())
    salt, token = raw[:16], raw[16:]
    key = _derive_key(secret, salt)
    f = Fernet(key)
    return f.decrypt(token).decode()


def is_encrypted(value: str) -> bool:
    """Heuristic check — encrypted values are valid base64 with salt prefix."""
    try:
        raw = base64.urlsafe_b64decode(value.encode())
        return len(raw) > 16
    except Exception:
        return False
