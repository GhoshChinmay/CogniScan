from cryptography.fernet import Fernet
import os
import base64

# ============================================================
# HIPAA-lite Data Encryption Utilities
# ============================================================
# For encrypting PII (Name, Phone, Email) before storing in DB.
# Uses AES-128-CBC via Fernet.

# Generate a key: base64.urlsafe_b64encode(os.urandom(32))
# In production, load this from AWS KMS / Azure Key Vault / .env
SECRET_KEY = os.environ.get("HIPAA_ENCRYPTION_KEY", Fernet.generate_key())
cipher_suite = Fernet(SECRET_KEY)

def encrypt_pii(data: str) -> str:
    """Encrypts a string containing Personally Identifiable Information."""
    if not data:
        return data
    encoded_data = data.encode('utf-8')
    encrypted_data = cipher_suite.encrypt(encoded_data)
    return encrypted_data.decode('utf-8')

def decrypt_pii(encrypted_data: str) -> str:
    """Decrypts a previously encrypted PII string."""
    if not encrypted_data:
        return encrypted_data
    try:
        decoded_data = cipher_suite.decrypt(encrypted_data.encode('utf-8'))
        return decoded_data.decode('utf-8')
    except Exception as e:
        # Avoid leaking exact decryption failure reasons
        raise ValueError("Failed to decrypt secure field.")
