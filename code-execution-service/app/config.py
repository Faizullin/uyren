from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Redis (for temporary execution tracking and WebSocket management)
    redis_url: str = "redis://localhost:6379/1"
    
    # Code Execution Service (Third-party API)
    code_execution_api_url: str = "https://onlinecompiler.io/api/v2/run-code/"
    code_execution_api_key: str = None
    
    # Frontend Service (for WebSocket callbacks)
    frontend_service_url: str = "http://localhost:3000"
    
    # Service Config
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = True
    
    # Execution tracking TTL (seconds)
    execution_ttl: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"


settings = Settings()
