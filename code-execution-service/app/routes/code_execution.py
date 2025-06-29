from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any
from datetime import datetime

from ..schemas import (
    CodeSubmissionRequest,
    CodeSubmissionResponse,
    ExecutionStatusResponse,
)
from ..services.code_execution import code_execution_service
from ..services.websocket import websocket_manager
from ..dependencies import require_auth

router = APIRouter()


@router.post("/execute", response_model=CodeSubmissionResponse)
async def submit_code_execution(
    submission: CodeSubmissionRequest, user: Dict[str, Any] = Depends(require_auth)
):
    """Submit code for execution"""
    try:
        execution_id = await code_execution_service.submit_code_execution(
            code=submission.code,
            language=submission.language,
            input_data=submission.input_data,
            user_id=user["uid"],
        )

        return CodeSubmissionResponse(
            execution_id=execution_id,
            status="pending",
            message=f"Code submitted for execution. Use execution_id: {execution_id} to track progress.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Execution submission failed: {str(e)}"
        )


@router.get("/status/{execution_id}", response_model=ExecutionStatusResponse)
async def get_execution_status(
    execution_id: str, user: Dict[str, Any] = Depends(require_auth)
):
    """Get execution status and results"""

    execution_data = await code_execution_service.get_execution_status(execution_id)

    if not execution_data:
        raise HTTPException(status_code=404, detail="Execution not found")

    # Verify user owns this execution
    if execution_data.get("user_id") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return ExecutionStatusResponse(**execution_data)


@router.websocket("/ws/{execution_id}")
async def websocket_endpoint(websocket: WebSocket, execution_id: str, token: str):
    """WebSocket endpoint for real-time execution updates"""

    # Verify authentication
    try:
        from ..services.firebase_auth import firebase_auth_service

        user_data = await firebase_auth_service.verify_firebase_token(f"Bearer {token}")
        user_id = user_data["uid"]
    except Exception:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Verify execution belongs to user
    execution_data = await code_execution_service.get_execution_status(execution_id)
    if not execution_data or execution_data.get("user_id") != user_id:
        await websocket.close(code=4003, reason="Forbidden")
        return

    await websocket.accept()
    await websocket_manager.connect(websocket, user_id, execution_id)

    try:
        # Send current status immediately
        await websocket_manager.send_execution_update(
            user_id, execution_id, execution_data
        )

        # Keep connection alive and listen for updates
        while True:
            try:
                # Check for execution updates periodically
                current_data = await code_execution_service.get_execution_status(
                    execution_id
                )
                if current_data and current_data.get("status") != execution_data.get(
                    "status"
                ):
                    await websocket_manager.send_execution_update(
                        user_id, execution_id, current_data
                    )
                    execution_data = current_data

                # Listen for client messages (like ping/pong)
                await websocket.receive_text()

            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"WebSocket error: {e}")
                break

    finally:
        await websocket_manager.disconnect(user_id, execution_id)


@router.post("/webhook/{tmp}")
async def webhook_execution_result(tmp: str, result_data: Dict[str, Any]):
    """Webhook endpoint to receive execution results from third-party API"""
    extra_params = result_data.get("extra_params", {})
    if "execution_id" not in extra_params:
        print("Webhook received without execution_id in extra_params")
        raise HTTPException(
            status_code=400, detail="Missing execution_id in extra_params"
        )
    execution_id = extra_params["execution_id"]
    try:
        # example: {'output': '', 'cpu': '0.05', 'memory': '9400', 'status': 'error', 'error': "line 1, in <module>\n    import pandas as pd\nModuleNotFoundError: No module named 'pandas'\n", 'extra_params': ''}
        # Parse the webhook result
        execution_result = {
            "output": result_data.get("output", ""),
            "error": result_data.get("error", ""),
            "execution_time": result_data.get("cpu", ""),
            "memory_usage": result_data.get("memory", ""),
        }

        # Determine status based on result
        status = result_data.get("status", "completed").lower()

        # Update execution status in Redis
        from ..database import redis_manager

        await redis_manager.update_execution_status(
            execution_id,
            status,
            output=execution_result.get("output", ""),
            error_output=execution_result.get("error", ""),
            execution_time=execution_result.get("execution_time", ""),
            memory_usage=execution_result.get("memory_usage", ""),
            completed_at=datetime.utcnow().isoformat(),
        )

        # Get execution data to find user_id for WebSocket notification
        execution_data = await code_execution_service.get_execution_status(execution_id)
        if execution_data:
            user_id = execution_data.get("user_id")
            if user_id:
                # Send WebSocket update to user
                await websocket_manager.send_execution_update(
                    user_id, execution_id, execution_data
                )

        return {"status": "success", "message": "Execution result received"}

    except Exception as e:
        print(f"Webhook error for execution: {e}")
        # Update status to error
        await redis_manager.update_execution_status(
            execution_id,
            "error",
            error_output=f"Webhook processing error: {str(e)}",
            completed_at=datetime.utcnow().isoformat(),
        )
        raise HTTPException(
            status_code=500, detail=f"Webhook processing failed: {str(e)}"
        )
