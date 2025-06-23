from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import redis_manager
from .routes import code_execution, health, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Redis connection
    try:
        await redis_manager.get_redis()
        print("Redis connection established")
    except Exception as e:
        print(f"Redis connection failed: {e}")
    
    yield
    
    # Cleanup
    try:
        await redis_manager.close()
        print("Redis connection closed")
    except Exception as e:
        print(f"Redis cleanup error: {e}")


app = FastAPI(
    title="Code Execution Service",
    description="Stateless microservice for code execution with Firebase authentication",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(code_execution.router, prefix="/api/v1/executions", tags=["code-execution"])


@app.get("/")
async def root():
    return {
        "message": "Code Execution Service",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "Firebase Authentication",
            "Stateless Code Execution",
            "Real-time WebSocket Updates",
            "Third-party API Integration"
        ]
    }
