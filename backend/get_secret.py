from app.config import get_settings

try:
    settings = get_settings()
    print(f"SECRET_KEY={settings.SECRET_KEY}")
    print(f"ALGORITHM={settings.ALGORITHM}")
    print(f"DEBUG={settings.DEBUG}")
except Exception as e:
    print(f"Error: {e}")
