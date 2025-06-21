export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime?: number;
}

export class CodeExecutionService {
  static async executeCode(code: string, language: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
          return await this.executeJavaScript(code);
        
        case 'python':
        case 'py':
          return {
            output: `Python execution not implemented yet.\nCode:\n${code}`,
            executionTime: Date.now() - startTime
          };
        
        case 'html':
          return {
            output: `HTML preview:\n${code}`,
            executionTime: Date.now() - startTime
          };
        
        default:
          return {
            output: `Language "${language}" is not supported for execution.\nCode:\n${code}`,
            executionTime: Date.now() - startTime
          };
      }
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      };
    }
  }

  private static async executeJavaScript(code: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create a safe execution context
      const logs: string[] = [];
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };

      // Mock console to capture output
      const mockConsole = {
        log: (...args: any[]) => logs.push(args.map(arg => String(arg)).join(' ')),
        error: (...args: any[]) => logs.push('ERROR: ' + args.map(arg => String(arg)).join(' ')),
        warn: (...args: any[]) => logs.push('WARN: ' + args.map(arg => String(arg)).join(' ')),
        info: (...args: any[]) => logs.push('INFO: ' + args.map(arg => String(arg)).join(' '))
      };

      // Create execution context
      const context = {
        console: mockConsole,
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        // Add more safe globals as needed
      };

      // Wrap code to return result
      const wrappedCode = `
        (function() {
          ${code}
        })()
      `;

      // Execute in controlled environment
      const result = new Function('context', `
        const { ${Object.keys(context).join(', ')} } = context;
        return ${wrappedCode};
      `)(context);

      const output = [];
      
      // Add console logs
      if (logs.length > 0) {
        output.push('Console output:');
        output.push(...logs);
      }
      
      // Add return value if exists
      if (result !== undefined) {
        output.push('Return value:');
        output.push(String(result));
      }

      return {
        output: output.length > 0 ? output.join('\n') : 'Code executed successfully (no output)',
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      };
    }
  }
}
