from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.routing import APIRoute
from fastapi.staticfiles import StaticFiles
from scalar_fastapi import add_scalar_reference
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    docs_url=None,
    generate_unique_id_function=custom_generate_unique_id,
)


add_scalar_reference(app, route="/docs")


if settings.FASTAPI_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_HOST],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
# Keep the old prefixed API available to direct backend clients while publishing
# only the canonical /v1 paths in OpenAPI.
app.include_router(api_router, prefix="/api/v1", include_in_schema=False)


@app.get("/api/v1/openapi.json", include_in_schema=False)
def legacy_openapi() -> dict[str, Any]:
    return app.openapi()


app.mount(
    "/",
    StaticFiles(directory=Path(__file__).resolve().parents[2] / "web" / "public"),
    name="public",
)
