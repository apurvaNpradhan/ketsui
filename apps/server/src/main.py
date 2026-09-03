"""FastAPI application entrypoint."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from scalar_fastapi import add_scalar_reference
from starlette.middleware.cors import CORSMiddleware

from src.agent.router import router as agent_router
from src.auth.router import router as auth_router
from src.config import settings
from src.db.session import close_db
from src.utils.router import router as utils_router


def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator:
    try:
        yield
    finally:
        await close_db()


show_docs = settings.FASTAPI_ENV in {"development", "staging"}
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json" if show_docs else None,
    docs_url=None,
    redoc_url=None,
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

if show_docs:
    add_scalar_reference(app, route="/docs")

if settings.FASTAPI_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_HOST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(agent_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(utils_router, prefix=settings.API_V1_STR)

app.mount(
    "/",
    StaticFiles(directory=Path(__file__).resolve().parents[2] / "web" / "public"),
    name="public",
)
