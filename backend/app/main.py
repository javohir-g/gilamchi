import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routers import auth, branches, users, products, sales, debts, expenses, collections, staff, telegram, settings as settings_router
from .utils.bot_service import run_bot
from .database import engine, Base

settings = get_settings()

# Create tables matching models
# In production, use Alembic. For quick start/MVP, this is fine.
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager
from .utils.bot_service import run_bot, stop_bot

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan handler for start and stop events.
    """
    logger.info("Startup: Preloading CLIP model...")
    bot_task = None
    try:
        from .utils.image_embedding import get_model
        import asyncio
        loop = asyncio.get_running_loop()
        
        # Preload the model in a thread to keep startup fast
        async def preload_in_background():
            try:
                await loop.run_in_executor(None, get_model)
                logger.info("Background: CLIP model preloaded successfully!")
            except Exception as e:
                logger.warning(f"Background warning: Failed to preload CLIP model: {e}")
        
        asyncio.create_task(preload_in_background())
        logger.info("Startup: CLIP model preload scheduled")
    except Exception as e:
        logger.error(f"Startup error: Initialization failed: {e}")

    yield  # Application is running

    # Shutdown logic
    print("Shutdown: Cleaning up background tasks...")
    if bot_task:
        bot_task.cancel()
        try:
            await bot_task
        except asyncio.CancelledError:
            pass
    
    # Ensure bot is stopped even if task cancellation didn't trigger it
    await stop_bot()
    print("Shutdown: Cleanup complete")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan
)

@app.middleware("http")
async def log_requests(request, call_next):
    origin = request.headers.get("origin")
    auth = request.headers.get("authorization", "")
    token_snippet = auth[:15] if auth else "None"
    logger.error(f"Incoming request: {request.method} {request.url} | Origin: {origin} | Auth: {token_snippet}...")
    response = await call_next(request)
    logger.error(f"Response status: {response.status_code}")
    return response


origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
app.include_router(collections.router, prefix="/api/collections", tags=["collections"])
app.include_router(staff.router, prefix="/api/staff", tags=["staff"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["telegram"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Gilamchi API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
