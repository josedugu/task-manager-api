from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    # TODO: Define your configuration settings
    # Consider:
    # - Database connection URL
    # - JWT secret key and algorithm
    # - CORS origins
    # - Logging configuration
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    LOG_LEVEL: str
    CORS_ORIGINS: list[str]
    PROJECT_NAME: str = "Task Manager API"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


settings = Settings()
