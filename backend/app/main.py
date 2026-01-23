from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routers import auth, branches, users, products, sales, debts, expenses
from .database import engine, Base

settings = get_settings()

# Create tables matching models
# In production, use Alembic. For quick start/MVP, this is fine.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

@app.on_event("startup")
async def startup_event():
    """
    Действия при запуске приложения:
    1. Загрузка CLIP модели в память (чтобы первый поиск был быстрым)
    """
    print("Startup: Preloading CLIP model...")
    try:
        from .utils.image_embedding import get_model
        # Запускаем в отдельном потоке, чтобы не блокировать startup (хотя для in-memory модели это быстро после скачивания)
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, get_model)
        print("Startup: CLIP model preloaded successfully!")
    except Exception as e:
        print(f"Startup warning: Failed to preload CLIP model: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Simplified to literal wildcard for robust handling
    allow_credentials=False, # Must be False when origin is *
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(branches.router, prefix="/api/branches", tags=["branches"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(sales.router, prefix="/api/sales", tags=["sales"])
app.include_router(debts.router, prefix="/api/debts", tags=["debts"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Gilamchi API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
