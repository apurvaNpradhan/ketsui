import pytest

from src.agent.agent import get_weather


@pytest.mark.asyncio
async def test_get_weather_rejects_blank_city() -> None:
    result = await get_weather("   ")

    assert result.error == "Tell me which city to check."
