import pytest
from pydantic_ai import DeferredToolRequests
from pydantic_ai.models.test import TestModel

from src.agent.agent import AgentDeps, agent, get_weather
from src.auth.schemas import CurrentUser


@pytest.mark.asyncio
async def test_get_weather_rejects_blank_city() -> None:
    result = await get_weather("   ")

    assert result.error == "Tell me which city to check."


@pytest.mark.asyncio
async def test_weather_call_waits_for_approval() -> None:
    model = TestModel(call_tools=["get_weather"])

    with agent.override(model=model):
        result = await agent.run(
            "What is the weather in London?",
            deps=AgentDeps(
                user=CurrentUser(
                    id="user-1", email="test@example.com", name="Test User"
                )
            ),
        )

    assert isinstance(result.output, DeferredToolRequests)
    assert [call.tool_name for call in result.output.approvals] == ["get_weather"]
    assert result.output.calls == []
