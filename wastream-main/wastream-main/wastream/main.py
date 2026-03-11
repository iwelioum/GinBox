import asyncio
import time
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from wastream.api.routes import router
from wastream.utils.database import setup_database, teardown_database, cleanup_expired_data
from wastream.utils.http_client import http_client
from wastream.config.settings import settings
from wastream.utils.logger import setup_logger, addon_logger, api_logger
from wastream.services.health import start_background_health_check


# ===========================
# Logger Setup
# ===========================
setup_logger(settings.LOG_LEVEL)


# ===========================
# Server Start Time
# ===========================
SERVER_START_TIME = int(time.time())


# ===========================
# Custom Middleware
# ===========================
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class LoguruMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        try:
            response = await call_next(request)
        except Exception as e:
            api_logger.error(f"Exception: {type(e).__name__}")
            raise
        finally:
            process_time = time.time() - start_time
            if request.url.path != "/health":
                safe_path = request.url.path
                path_parts = safe_path.split("/")
                if len(path_parts) > 3 and path_parts[3] in ("stream", "manifest.json", "configure"):
                    path_parts[2] = "***"
                    safe_path = "/".join(path_parts)
                api_logger.debug(f"{request.method} {safe_path} - {response.status_code if 'response' in locals() else '500'} - {process_time:.2f}s")
        return response


# ===========================
# Application Lifecycle
# ===========================
@asynccontextmanager
async def lifespan(app: FastAPI):
    await setup_database()
    cleanup_task = asyncio.create_task(cleanup_expired_data())
    health_check_task = asyncio.create_task(start_background_health_check())

    yield

    cleanup_task.cancel()
    health_check_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    try:
        await health_check_task
    except asyncio.CancelledError:
        pass

    await http_client.close()
    await teardown_database()


# ===========================
# FastAPI Application Setup
# ===========================
app = FastAPI(
    title=settings.ADDON_NAME,
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoguruMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent / "public"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="public")
app.include_router(router)


# ===========================
# Application Entry Point
# ===========================
if __name__ == "__main__":

    if not settings.WAWACITY_URL and not settings.FREE_TELECHARGER_URL and not settings.DARKI_API_URL and not settings.MOVIX_URL and not settings.WEBSHARE_URL:
        addon_logger.error("No source configured (WAWACITY_URL, FREE_TELECHARGER_URL, DARKI_API_URL, MOVIX_URL, WEBSHARE_URL)!")
        addon_logger.error("The addon will not be able to find any content!")
        addon_logger.error("Please configure at least one source in your .env file")

    addon_logger.info(f"Starting {settings.ADDON_NAME} v{settings.ADDON_MANIFEST['version']} ({settings.ADDON_ID})")
    addon_logger.info(f"Server: http://localhost:{settings.PORT}/")
    addon_logger.info(f"Wawacity: {settings.WAWACITY_URL or 'NOT CONFIGURED'}")
    addon_logger.info(f"Free-Telecharger: {settings.FREE_TELECHARGER_URL or 'NOT CONFIGURED'}")
    addon_logger.info(f"Darki-API: {settings.DARKI_API_URL or 'NOT CONFIGURED'}")
    addon_logger.info(f"Movix: {settings.MOVIX_URL or 'NOT CONFIGURED'}")
    addon_logger.info(f"Webshare: {settings.WEBSHARE_URL or 'NOT CONFIGURED'}")
    addon_logger.info(f"Database: {settings.DATABASE_TYPE} v{settings.DATABASE_VERSION}")
    addon_logger.info(f"Proxy: {'enabled' if settings.PROXY_URL else 'disabled'}")
    addon_logger.info(f"Log level: {settings.LOG_LEVEL}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.PORT,
        log_config=None
    )
