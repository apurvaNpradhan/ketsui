"""AG-UI endpoint for the application agent."""

from fastapi import APIRouter, Request
from fastapi.responses import Response
from pydantic_ai.ui.ag_ui import AGUIAdapter

from src.agent.agent import AgentDeps, agent
from src.auth.dependencies import CurrentUserDep

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/", response_class=Response)
async def run_agent(request: Request, current_user: CurrentUserDep) -> Response:
    """Run the authenticated agent and stream AG-UI events."""

    return await AGUIAdapter.dispatch_request(
        request,
        agent=agent,
        deps=AgentDeps(user=current_user),
    )
