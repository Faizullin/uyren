import React, { useState, useCallback } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { CodeExecutionService } from "../../utils/codeExecution";

interface CodeBlockProps {
  node: ProseMirrorNode;
  updateAttributes: (attributes: Record<string, any>) => void;
  extension: any;
}

export const CodeBlockComponent: React.FC<CodeBlockProps> = ({
  node,
  updateAttributes,
  extension,
}) => {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const language = node.attrs.language || "plaintext";
  const code = node.textContent;  const executeCode = useCallback(async () => {
    if (!code.trim()) {
      setOutput("No code to execute");
      setShowOutput(true);
      setExecutionStatus('error');
      return;
    }

    setIsRunning(true);
    setShowOutput(true);
    setExecutionStatus('running');

    try {
      const result = await CodeExecutionService.executeCode(code, language);
      console.log("Execution result:", result);
      setLastExecutionTime(result.executionTime || 0);
      
      if (result.error) {
        setOutput(`❌ Execution Error:\n${result.error}\n\n⏱️ Execution time: ${result.executionTime}ms`);
        setExecutionStatus('error');
      } else {
        setOutput(`✅ ${result.output}\n\n⏱️ Execution time: ${result.executionTime}ms`);
        setExecutionStatus('success');
      }
    } catch (error) {
      setOutput(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      setExecutionStatus('error');
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  const toggleOutput = useCallback(() => {
    setShowOutput(!showOutput);
  }, [showOutput]);

  const clearOutput = useCallback(() => {
    setOutput("");
    setShowOutput(false);
  }, []);

  return (
    <NodeViewWrapper className="rte-codeblock">
      <div className="rte-codeblock__container">
        {/* Header with language and controls */}        <div className="rte-codeblock__header">
          <div className="rte-codeblock__language">
            <span className="rte-codeblock__language-label">{language}</span>
            {executionStatus !== 'idle' && (
              <span className={`rte-codeblock__status rte-codeblock__status--${executionStatus}`}>
                {executionStatus === 'running' && '⏳ Running...'}
                {executionStatus === 'success' && '✅ Success'}
                {executionStatus === 'error' && '❌ Error'}
              </span>
            )}
          </div>
          <div className="rte-codeblock__controls">
            {lastExecutionTime && (
              <span className="rte-codeblock__execution-time">
                {lastExecutionTime}ms
              </span>
            )}
            <button
              className="rte-button rte-button--ghost rte-button--icon-only rte-codeblock__btn"
              onClick={executeCode}
              disabled={isRunning}
              title="Run code"
            >
              {isRunning ? (
                <svg className="rte-codeblock__spinner" width="16" height="16" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="32"
                    strokeDashoffset="32"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0 12 12;360 12 12"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 5v14l11-7L8 5z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
            {showOutput && (
              <>
                <button
                  className="rte-button rte-button--ghost rte-button--icon-only rte-codeblock__btn"
                  onClick={toggleOutput}
                  title="Toggle output"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d={showOutput ? "M6 9l6 6 6-6" : "M9 18l6-6-6-6"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  className="rte-button rte-button--ghost rte-button--icon-only rte-codeblock__btn"
                  onClick={clearOutput}
                  title="Clear output"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Code content */}
        <div className="rte-codeblock__content">
          <pre className="rte-codeblock__pre">
            <NodeViewContent as="code" className="rte-codeblock__code" />
          </pre>
        </div>        {/* Output section */}
        {showOutput && (
          <div className={`rte-codeblock__output ${
            executionStatus === 'error' ? 'rte-codeblock__output--error' : 
            executionStatus === 'success' ? 'rte-codeblock__output--success' : ''
          }`}>
            <div className="rte-codeblock__output-header">
              <span className="rte-codeblock__output-label">Output</span>
            </div>
            <div className="rte-codeblock__output-content">
              <pre className="rte-codeblock__output-pre">
                {output || "No output"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
