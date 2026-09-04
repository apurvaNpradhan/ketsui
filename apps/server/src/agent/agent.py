"""Pydantic AI agent definition."""

from dataclasses import dataclass
from typing import Annotated, Any, Literal

import httpx
from pydantic import BaseModel, Field
from pydantic_ai import Agent, DeferredToolRequests, RunContext
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from src.agent.config import agent_settings
from src.auth.schemas import CurrentUser


@dataclass(frozen=True)
class AgentDeps:
    """Server-established context for one agent run."""

    user: CurrentUser


class WeatherResult(BaseModel):
    """Current weather data returned to the agent and frontend."""

    city: str
    country: str | None = None
    temperature: float | None = None
    unit: Literal["celsius", "fahrenheit"]
    condition: str | None = None
    humidity: int | None = None
    wind_speed: float | None = None
    error: str | None = None


model = OpenAIChatModel(
    agent_settings.MODEL,
    provider=OpenAIProvider(
        base_url=str(agent_settings.ENDPOINT),
        api_key=(
            agent_settings.API_KEY.get_secret_value()
            if agent_settings.API_KEY is not None
            else None
        ),
    ),
)

agent = Agent[AgentDeps, str | DeferredToolRequests](
    model,
    name="ketsui_steward",
    deps_type=AgentDeps,
    output_type=[str, DeferredToolRequests],
    instructions=(
        "You are a personal life steward. Be concise, practical, and warm. "
        "Help the user make plans, but never take an external action without "
        "clear approval. Use get_weather for current weather questions instead "
        "of guessing or relying on stale knowledge."
    ),
)


@agent.instructions
def authenticated_user(ctx: RunContext[AgentDeps]) -> str:
    """Provide authenticated user context without trusting the client history."""

    return f"You are assisting {ctx.deps.user.name} (user ID: {ctx.deps.user.id})."


_WEATHER_CONDITIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    56: "Light freezing drizzle",
    57: "Freezing drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Freezing rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Light rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",
    85: "Light snow showers",
    86: "Snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with light hail",
    99: "Thunderstorm with heavy hail",
}


@agent.tool_plain
async def get_weather(
    city: Annotated[str, Field(min_length=1, max_length=100)],
    unit: Literal["celsius", "fahrenheit"] = "celsius",
) -> WeatherResult:
    """Get the current weather for a city."""

    city = city.strip()
    if not city:
        return WeatherResult(city=city, unit=unit, error="Tell me which city to check.")

    temperature_unit = "fahrenheit" if unit == "fahrenheit" else "celsius"
    wind_speed_unit = "mph" if unit == "fahrenheit" else "kmh"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            geocoding_response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city, "count": 1, "language": "en", "format": "json"},
            )
            geocoding_response.raise_for_status()
            locations: list[dict[str, Any]] = geocoding_response.json().get(
                "results", []
            )
            if not locations:
                return WeatherResult(
                    city=city,
                    unit=unit,
                    error=f"I couldn't find a city named {city}.",
                )

            location = locations[0]
            forecast_response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": location["latitude"],
                    "longitude": location["longitude"],
                    "current": (
                        "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
                    ),
                    "temperature_unit": temperature_unit,
                    "wind_speed_unit": wind_speed_unit,
                    "timezone": "auto",
                },
            )
            forecast_response.raise_for_status()
            current: dict[str, Any] = forecast_response.json()["current"]
    except httpx.HTTPError:
        return WeatherResult(
            city=city,
            unit=unit,
            error="The weather service is unavailable right now.",
        )

    weather_code = int(current["weather_code"])
    return WeatherResult(
        city=str(location.get("name", city)),
        country=location.get("country"),
        temperature=float(current["temperature_2m"]),
        unit=unit,
        condition=_WEATHER_CONDITIONS.get(weather_code, "Unknown conditions"),
        humidity=int(current["relative_humidity_2m"]),
        wind_speed=float(current["wind_speed_10m"]),
    )
