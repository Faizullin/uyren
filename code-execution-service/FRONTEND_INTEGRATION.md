# Frontend Integration Guide - Code Execution Service

## Overview

This FastAPI microservice provides **stateless code execution** with **Firebase authentication** and **real-time WebSocket communication**. No persistent database storage is used for submissions - only temporary Redis caching.

## Architecture Flow

```
Frontend → Firebase Auth → FastAPI Service → Third-party API → WebSocket Updates → Frontend
```

## Key Features

1. **Firebase Authentication** - All requests require valid Firebase JWT tokens
2. **Stateless Execution** - No database persistence for submissions
3. **Redis Caching** - Temporary storage with TTL (1 hour)
4. **Real-time Updates** - WebSocket for live execution status
5. **Third-party Integration** - External code execution API

## API Endpoints

### 1. Submit Code for Execution

**POST** `/api/v1/executions/execute`

**Headers:**
```json
{
  "Authorization": "Token <firebase_jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "code": "print('Hello World')",
  "language": "python",
  "input_data": ""
}
```

**Response:**
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Code submitted for execution. Use execution_id: 550e8400-e29b-41d4-a716-446655440000 to track progress."
}
```

### 2. Get Execution Status

**GET** `/api/v1/executions/status/{execution_id}`

**Headers:**
```json
{
  "Authorization": "Token <firebase_jwt_token>"
}
```

**Response:**
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "firebase_user_uid",
  "code": "print('Hello World')",
  "language": "python",
  "input_data": "",
  "status": "completed",
  "output": "Hello World\n",
  "error_output": "",
  "execution_time": "0.05s",
  "memory_usage": "2.1MB",
  "created_at": "2025-06-22T10:30:00.000Z",
  "updated_at": "2025-06-22T10:30:02.000Z",
  "completed_at": "2025-06-22T10:30:02.000Z"
}
```

### 3. WebSocket for Real-time Updates

**WebSocket** `/api/v1/executions/ws/{execution_id}?token={firebase_jwt_token}`

**Connection URL:**
```
ws://localhost:8001/api/v1/executions/ws/550e8400-e29b-41d4-a716-446655440000?token=your_firebase_jwt_token
```

**WebSocket Messages:**
```json
{
  "type": "execution_update",
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "status": "running",
    "output": "",
    "execution_time": null
  }
}
```

## Frontend Implementation Example

### React/JavaScript Implementation

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

class CodeExecutionClient {
  constructor() {
    this.baseUrl = 'http://localhost:8001';
    this.auth = getAuth();
    this.currentToken = null;
    
    // Listen for auth changes
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        user.getIdToken().then(token => {
          this.currentToken = token;
        });
      }
    });
  }

  async submitCode(code, language, inputData = '') {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/executions/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        language,
        input_data: inputData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getExecutionStatus(executionId) {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/executions/status/${executionId}`, {
      headers: {
        'Authorization': `Bearer ${this.currentToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  connectWebSocket(executionId, onMessage, onError, onClose) {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    const wsUrl = `ws://localhost:8001/api/v1/executions/ws/${executionId}?token=${this.currentToken}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (onClose) onClose(event);
    };

    return ws;
  }
}

// Usage Example
const codeClient = new CodeExecutionClient();

async function executeCode() {
  try {
    // Submit code
    const submission = await codeClient.submitCode(
      "print('Hello World')",
      "python",
      ""
    );
    
    console.log('Submission:', submission);
    const executionId = submission.execution_id;

    // Connect WebSocket for real-time updates
    const ws = codeClient.connectWebSocket(
      executionId,
      (message) => {
        console.log('WebSocket message:', message);
        
        if (message.type === 'execution_update') {
          const status = message.data.status;
            switch (status) {
            case 'pending':
              console.log('Execution pending...');
              break;
            case 'running':
              console.log('Code is running...');
              break;
            case 'waiting':
              console.log('Code submitted to API, waiting for results...');
              break;
            case 'completed':
              console.log('Execution completed!');
              console.log('Output:', message.data.output);
              ws.close(); // Close WebSocket when done
              break;
            case 'error':
              console.log('Execution failed!');
              console.log('Error:', message.data.error_output);
              ws.close();
              break;
          }
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
      },
      (event) => {
        console.log('WebSocket closed');
      }
    );

  } catch (error) {
    console.error('Error:', error);
  }
}
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth'; // Your Firebase auth hook

const CodeExecutor = () => {
  const { user } = useAuth();
  const [code, setCode] = useState("print('Hello World')");
  const [language, setLanguage] = useState('python');
  const [inputData, setInputData] = useState('');
  const [execution, setExecution] = useState(null);
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const codeClient = new CodeExecutionClient();

  const handleSubmit = async () => {
    try {
      setStatus('submitting');
      setOutput('');
      setError('');

      const submission = await codeClient.submitCode(code, language, inputData);
      setExecution(submission);
      setStatus('submitted');

      // Connect WebSocket
      const ws = codeClient.connectWebSocket(
        submission.execution_id,
        (message) => {
          if (message.type === 'execution_update') {
            const data = message.data;
            setStatus(data.status);
            
            if (data.output) setOutput(data.output);
            if (data.error_output) setError(data.error_output);
            
            if (data.status === 'completed' || data.status === 'error') {
              ws.close();
            }
          }
        }
      );

    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="code-executor">
      <div className="editor">
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code here..."
          rows={10}
        />
        
        <textarea
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Input data (optional)"
          rows={3}
        />
        
        <button 
          onClick={handleSubmit} 
          disabled={!user || status === 'running'}
        >
          {status === 'running' ? 'Running...' : 'Execute Code'}
        </button>
      </div>

      <div className="results">
        <div className="status">
          Status: <span className={`status-${status}`}>{status}</span>
        </div>
        
        {output && (
          <div className="output">
            <h3>Output:</h3>
            <pre>{output}</pre>
          </div>
        )}
        
        {error && (
          <div className="error">
            <h3>Error:</h3>
            <pre>{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeExecutor;
```

## Status Flow

1. **idle** → User hasn't submitted code yet
2. **submitting** → Frontend is submitting code to API
3. **pending** → Code submission received, queued for execution
4. **running** → Code request sent to third-party API
5. **waiting** → Third-party API returned "Ok", waiting for webhook result
6. **completed** → Execution finished successfully (via webhook)
7. **error** → Execution failed with errors (via webhook or API error)

## Webhook Integration

The service now handles execution results via webhook:

### Webhook Endpoint
**POST** `/api/v1/executions/webhook/{execution_id}`

**Request Body:**
```json
{
  "output": "Hello World\n",
  "error": "",
  "cpuTime": "0.05s",
  "memory": "2.1MB"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Execution result received"
}
```

### Execution Flow

1. **Submit Code** → API returns execution_id with "pending" status
2. **Third-party API Call** → Service sends code to external API
3. **"Ok" Response** → Status changes to "waiting"
4. **Webhook Result** → External API sends results to webhook endpoint
5. **Status Update** → Status changes to "completed" or "error"
6. **WebSocket Notification** → Frontend receives real-time update

## Error Handling

- **401 Unauthorized** - Invalid or expired Firebase token
- **403 Forbidden** - User doesn't own the execution
- **404 Not Found** - Execution ID not found or expired
- **500 Internal Server Error** - Service error

## Security Notes

1. All requests require valid Firebase JWT tokens
2. Users can only access their own executions
3. Execution data expires after 1 hour (Redis TTL)
4. WebSocket connections are authenticated per execution
5. No persistent storage of code submissions

## Deployment Configuration

Create `.env` file:
```env
REDIS_URL=redis://localhost:6379/1
CODE_EXECUTION_API_URL=https://onlinecompiler.io/api/v2/run-code/
CODE_EXECUTION_API_KEY=your_api_key
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
HOST=0.0.0.0
PORT=8001
DEBUG=true
EXECUTION_TTL=3600
```

## Running the Service

```bash
# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

This architecture provides a clean, stateless code execution service with real-time feedback, perfect for educational platforms and coding challenges!
