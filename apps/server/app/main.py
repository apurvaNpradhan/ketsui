from typing import Any

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.config import settings


def custom_generate_unique_id(route: APIRoute) -> str:
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

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
