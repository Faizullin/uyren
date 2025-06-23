import { useAsyncCodeExecution } from "@/components/code/code-block/hooks";
import { Log } from "@/lib/log";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import React, { useCallback, useMemo, useState } from "react";

interface CodeBlockProps {
  node: ProseMirrorNode;
  updateAttributes: (attributes: Record<string, any>) => void;
  extension: any;
}

export const CodeBlockComponent: React.FC<CodeBlockProps> = ({
  node,
}) => {
  const [showOutput, setShowOutput] = useState(false);

  // Use the execution hook directly
  const { isExecuting, currentJob, error: executionError, executeCode, cancelExecution, clearError } = useAsyncCodeExecution({
    onProgress: (status) => {
      console.log('Code execution progress:', status);
    },
    onComplete: (result) => {
      console.log('Code execution completed:', result);
      setShowOutput(true);
    },
    onError: (error) => {
      console.error('Code execution error:', error);
      setShowOutput(true);
    }
  });

  const language = node.attrs.language || "plaintext";
  const code = node.textContent;
  const settings = node.attrs.settings || {
    can_edit: false,
    can_run: false,
    can_open_editor: false,
    render_type: "code",
  };

  // Extract execution state from current job
  const output = currentJob?.output || "";
  const jobError = currentJob?.error || executionError?.message || "";
  const executionTime = currentJob?.executionTime || null;
  const rawStatus = currentJob?.status || 'idle';

  // Map job status to display status
  const executionStatus = useMemo(() => {
    if (rawStatus === 'success') return 'success';
    if (rawStatus === 'error') return 'error';
    if (rawStatus === 'waiting') return 'waiting';
    if (rawStatus === 'running') return 'running';
    return rawStatus;
  }, [rawStatus]);

  const handleExecuteCode = useCallback(async () => {
    if (!code.trim()) {
      Log.warn("No code to execute");
      return;
    }

    try {
      clearError(); // Clear any previous errors
      await executeCode(code, language);
    } catch (error) {
      Log.error('Code execution failed:', error);
    }
  }, [code, language, executeCode, clearError]);

  const handleCancelExecution = useCallback(async () => {
    try {
      await cancelExecution();
    } catch (error) {
      Log.error('Failed to cancel execution:', error);
    }
  }, [cancelExecution]);

  const toggleOutput = useCallback(() => {
    setShowOutput(!showOutput);
  }, [showOutput]);

  const clearOutput = useCallback(() => {
    setShowOutput(false);
    clearError();
  }, [clearError]);

  return (
    <NodeViewWrapper className="rte-codeblock">
      <div className="rte-codeblock__container">
        {/* Header with language and controls */}
        <div className="rte-codeblock__header">
          <div className="rte-codeblock__language">
            <span className="rte-codeblock__language-label">{language}</span>
            {executionStatus !== 'idle' && (
              <span className={`rte-codeblock__status rte-codeblock__status--${executionStatus}`}>
                {executionStatus === 'running' && '⏳ Running...'}
                {executionStatus === 'waiting' && '⏳ Waiting...'}
                {executionStatus === 'success' && '✅ Success'}
                {executionStatus === 'error' && '❌ Error'}
              </span>
            )}
          </div>

          <div className="rte-codeblock__controls">
            {executionTime && (
              <span className="rte-codeblock__execution-time">
                {executionTime}ms
              </span>
            )}

            {settings.can_run && (
              <>
                <button
                  className="rte-button rte-button--ghost rte-button--icon-only rte-codeblock__btn"
                  onClick={handleExecuteCode}
                  disabled={isExecuting}
                  title="Run code"
                >
                  {isExecuting ? (
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
                {isExecuting && (
                  <button
                    className="rte-button rte-button--ghost rte-button--icon-only rte-codeblock__btn"
                    onClick={handleCancelExecution}
                    title="Cancel execution"
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
                )}
              </>
            )}
            {(showOutput && (output || jobError)) && (
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
        </div>

        {/* Output section */}
        {showOutput && (output || jobError) && (
          <div className={`rte-codeblock__output ${
            executionStatus === 'error' ? 'rte-codeblock__output--error' :
            executionStatus === 'success' ? 'rte-codeblock__output--success' : ''
          }`}>
            <div className="rte-codeblock__output-header">
              <span className="rte-codeblock__output-label">Output</span>
            </div>
            <div className="rte-codeblock__output-content">
              <pre className="rte-codeblock__output-pre">
                {jobError ? `❌ Error: ${jobError}` : output || "No output"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
