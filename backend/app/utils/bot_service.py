import logging
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
from ..config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# The frontend URL for the Mini App
# In production, this should be the public URL
# For local testing, it might be different
WEB_APP_URL = "https://gilamchi-taupe.vercel.app/" # User's frontend URL as seen in previous logs if available, or just a placeholder

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    args = context.args # Deep link parameters (e.g., /start <token>)
    token = args[0] if args else None
    
    url = WEB_APP_URL
    if token:
        # If there's a token, we might want to pass it to the WebApp-
        # Telegram handles this via start_param which is available in initDataUnsafe
        # The URL remains the same, but the app will see the start_param.
        url = WEB_APP_URL # Start param is handled by Telegram deep links automatically
        message = f"Xush kelibsiz, {user.first_name}! Ro'yxatdan o'tishni yakunlash uchun pastdagi tugmani bosing."
    else:
        message = f"Xush kelibsiz, {user.first_name}! Gilamchi tizimiga kirish uchun pastdagi tugmani bosing."

    keyboard = [
        [
            InlineKeyboardButton(
                "Ilovani ochish", 
                web_app=WebAppInfo(url=url)
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup)

async def run_bot():
    """Start the bot in polling mode"""
    if not settings.telegram_bot_token:
        logger.warning("TELEGRAM_BOT_TOKEN is not set. Bot will not start.")
        return

    application = ApplicationBuilder().token(settings.telegram_bot_token).build()
    
    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)
    
    logger.info("Starting Telegram bot polling...")
    # This will run as a background task in FastAPI
    async with application:
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        # Keep running until cancelled
        while True:
            await asyncio.sleep(3600)
