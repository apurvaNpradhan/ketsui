"""AI agent configuration."""

from pathlib import Path

from pydantic import AnyHttpUrl, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentSettings(BaseSettings):
    """Settings for the agent provider."""

    model_config = SettingsConfigDict(
        env_prefix="AI_",
        env_file=Path(__file__).resolve().parents[4] / ".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    ENDPOINT: str = "https://api.openai.com/v1"
    API_KEY: SecretStr | None = None
    MODEL: str = "gpt-4o-mini"

    @field_validator("ENDPOINT")
    @classmethod
    def _validate_endpoint(cls, value: str) -> str:
        AnyHttpUrl(value)
        return value


agent_settings = AgentSettings()
