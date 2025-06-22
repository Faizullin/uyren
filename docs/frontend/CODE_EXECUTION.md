# Code Execution Component

This component provides code execution capabilities through the Ideone API, allowing users to run code directly from within the TiptapEditor.

## Features

- **Multi-language Support**: Supports 13+ programming languages including JavaScript, Python, Java, C++, C#, and more
- **Real-time Execution**: Execute code with live output display
- **Error Handling**: Comprehensive error reporting including compilation errors, runtime errors, and timeouts
- **Execution History**: Keeps track of recent executions
- **Memory & Time Tracking**: Shows execution time and memory usage
- **Input Support**: Allows providing standard input for programs

## Components

### `CodeRunner`
The main code execution interface with a full editor and output display.

```tsx
import { CodeRunner } from '@/components/code';

<CodeRunner 
  initialCode="console.log('Hello, World!');"
  initialLanguage="javascript"
/>
```

### `CodeExecuteButton`
A compact button component for quick code execution, perfect for integration with editors.

```tsx
import { CodeExecuteButton } from '@/components/code';

<CodeExecuteButton 
  code={codeContent}
  language="python"
  size="sm"
  variant="outline"
/>
```

## Setup

### 1. Environment Configuration

Create a `.env.local` file with your Ideone API credentials:

```bash
NEXT_PUBLIC_IDEONE_USER=your_ideone_username
NEXT_PUBLIC_IDEONE_PASSWORD=your_ideone_password
```

**Note**: In production, these should be backend-only environment variables for security.

### 2. Get Ideone API Credentials

1. Visit [ideone.com](https://ideone.com)
2. Create an account
3. Navigate to the API section to get your username and password
4. Add them to your environment variables

### 3. API Endpoint

The component uses `/api/code-execution` endpoint to proxy requests to Ideone API (avoiding CORS issues).

## Supported Languages

| Language   | Version    | Ideone ID |
|------------|------------|-----------|
| JavaScript | Node.js 16 | 56        |
| Python     | 3.10.x     | 116       |
| Java       | 17.x       | 62        |
| C++        | GCC 11.x   | 54        |
| C          | GCC 11.x   | 11        |
| C#         | .NET 6.x   | 27        |
| PHP        | 8.x        | 29        |
| Ruby       | 3.x        | 17        |
| Go         | 1.19.x     | 114       |
| Rust       | 1.65.x     | 93        |
| Swift      | 5.x        | 85        |
| Kotlin     | 1.7.x      | 75        |
| TypeScript | Node.js 16 | 56        |

## Usage in TiptapEditor

The `CodeExecuteButton` is automatically integrated into the `CodeBlockMenu` when a code block is selected:

1. Create or select a code block in the editor
2. Set the language using the language dropdown
3. Click the "Run" button that appears in the toolbar
4. View the execution results in the modal dialog

## API Response Handling

The component handles various execution statuses:

- **Success**: Code executed successfully
- **Compilation Error**: Syntax or compilation issues
- **Runtime Error**: Errors during execution
- **Timeout**: Execution exceeded time limit
- **Memory Limit**: Memory usage exceeded limit

## Customization

### Adding New Languages

To add support for new languages:

1. Add the language to `SUPPORTED_LANGUAGES` in `types/code-runner.types.ts`
2. Add the Ideone language ID to `IDEONE_LANGUAGE_MAP`
3. Update the language dropdown in your editor

### Alternative Execution Services

The architecture supports alternative code execution services:

```typescript
// Implement a new service
class Judge0Service implements CodeExecutionService {
  async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    // Implementation for Judge0 API
  }
}
```

## Security Considerations

- **Backend Proxy**: API credentials should never be exposed to the frontend
- **Input Validation**: Validate and sanitize code input
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Timeout Handling**: Set appropriate execution timeouts
- **Resource Limits**: Monitor and limit resource usage

## Error Handling

The component provides comprehensive error handling:

- Network errors
- API rate limits
- Invalid credentials
- Unsupported languages
- Execution timeouts
- Memory limits

## Performance Optimization

- **Debounced Execution**: Prevents rapid successive executions
- **Result Caching**: Recent results are cached for quick access
- **Lazy Loading**: Components are loaded only when needed
- **Abort Controllers**: Allows canceling in-progress executions

## Example Usage

```tsx
import { CodeRunner, CodeExecuteButton, useCodeExecution } from '@/components/code';

// Full code runner
function CodePlayground() {
  return (
    <CodeRunner 
      initialCode={`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))`}
      initialLanguage="python"
    />
  );
}

// Custom implementation with hook
function CustomCodeRunner() {
  const { executeCode, result, isExecuting } = useCodeExecution();
  
  const handleRun = () => {
    executeCode({
      code: 'print("Hello, World!")',
      language: 'python',
      input: ''
    });
  };
  
  return (
    <div>
      <button onClick={handleRun} disabled={isExecuting}>
        {isExecuting ? 'Running...' : 'Run Code'}
      </button>
      {result && <pre>{result.output}</pre>}
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **"Missing Ideone credentials"**: Ensure environment variables are set correctly
2. **CORS errors**: Make sure you're using the API proxy endpoint
3. **Timeout errors**: Check internet connection and Ideone service status
4. **Compilation errors**: Verify code syntax for the selected language

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_DEBUG_CODE_EXECUTION=true
```

This will log API requests and responses to the browser console.
