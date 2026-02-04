from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.settings import Settings
from ..schemas.settings import SettingsResponse, SettingsUpdate
from ..utils.dependencies import get_admin_user

router = APIRouter()

@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        # Create default settings if not exists
        settings = Settings(exchange_rate=12200.0)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.patch("/", response_model=SettingsResponse)
def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_admin_user)
):
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(exchange_rate=settings_update.exchange_rate)
        db.add(settings)
    else:
        settings.exchange_rate = settings_update.exchange_rate
    
    db.commit()
    db.refresh(settings)
    return settings
