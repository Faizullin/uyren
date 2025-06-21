# Interactive Code Block Component

## Overview

This is a beautiful, interactive code block component for the TiptapEditor that includes:

- ✨ **Beautiful syntax highlighting** using Lowlight (highlight.js)
- ▶️ **Play button** to execute code directly in the editor
- 📊 **Output preview** section below the code block
- ⏱️ **Execution time tracking**
- 🎨 **Status indicators** (idle, running, success, error)
- 🎯 **Language detection** and appropriate highlighting

## Features

### Visual Enhancements
- Modern, clean design with rounded corners and subtle shadows
- Hover effects and smooth transitions
- Color-coded language labels
- Status indicators with appropriate colors
- Execution time badges

### Functionality
- **JavaScript Execution**: Safe execution environment with console output capture
- **Multi-language Support**: Ready for Python, HTML, and other languages
- **Error Handling**: Comprehensive error catching and display
- **Output Management**: Toggle, clear, and auto-show output sections

### Code Execution Service
- **Safe Execution**: Sandboxed JavaScript execution
- **Console Capture**: Captures console.log, error, warn, info outputs
- **Performance Monitoring**: Tracks and displays execution time
- **Error Handling**: Graceful error handling with detailed messages

## File Structure

```
src/components/editor/TiptapEditor/
├── components/
│   └── CodeBlock.tsx                 # Main React component
├── extensions/
│   └── CodeBlock/
│       ├── CodeBlock.ts             # Tiptap extension
│       ├── lowlight-plugin.ts       # Syntax highlighting plugin
│       └── index.ts
├── utils/
│   └── codeExecution.ts             # Code execution service
└── styles/
    └── components.scss              # Beautiful styling
```

## Usage

1. **Create a code block** in the editor using ```language syntax
2. **Click the play button** (▶️) to execute the code
3. **View the output** in the collapsible section below
4. **Toggle or clear output** using the control buttons

### Supported Languages

- **JavaScript/JS**: Full execution with console output
- **Python**: Mock execution (ready for backend integration)
- **HTML**: Preview mode
- **Other languages**: Syntax highlighting only

## Example Code Blocks

### JavaScript
```javascript
// Calculate fibonacci numbers
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 8; i++) {
  console.log(`fib(${i}) = ${fibonacci(i)}`);
}

return "Fibonacci calculation complete!";
```

### Python (Mock)
```python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("This is a Python example")
```

## Styling

The component uses CSS custom properties for theming:

- `--rte-bg`: Background color
- `--rte-primary`: Primary accent color
- `--rte-border`: Border colors
- `--rte-hljs-*`: Syntax highlighting colors

## Future Enhancements

- [ ] Backend code execution service integration
- [ ] More language support (Python, Go, Rust, etc.)
- [ ] Code sharing and export functionality
- [ ] Collaborative execution
- [ ] Code formatting and linting
- [ ] File upload and import capabilities

## Security

The JavaScript execution environment is sandboxed and includes:
- Limited global scope access
- No DOM manipulation capabilities
- Console output capture
- Error boundary protection

**Note**: For production use, consider using a secure backend execution service for all code execution.
