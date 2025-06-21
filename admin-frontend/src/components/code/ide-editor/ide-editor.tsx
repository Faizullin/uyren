"use client";

import { DocumentId, IDEConfig, IDEOutput, IDETemplate } from "@/types";
import Editor from "@monaco-editor/react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VisualTab = "index.html" | "index.css" | "index.js";
type OutputTab = "console" | "preview";

interface AttachedFile {
  name: string;
  content: string;
  language: string;
}

interface IDEProps<T> {
  // Core configuration
  config: IDEConfig;

  // Data binding
  data?: T;
  onDataChange?: (data: T) => void;

  // Code execution
  onExecute?: (code: string, data?: T) => Promise<IDEOutput[]>;
  onSave?: (code: string, data?: T) => Promise<void>;

  // Templates and presets
  templates?: IDETemplate[];
  defaultTemplate?: DocumentId;

  // Visual mode files (if applicable)
  visualFiles?: Record<string, string>;
  onVisualFilesChange?: (files: Record<string, string>) => void;

  // Attached files
  attachedFiles?: AttachedFile[];
  onAttachedFilesChange?: (files: AttachedFile[]) => void;

  // Customization
  className?: string;
  height?: string;
  title?: string;

  // Advanced features
  enableCollaboration?: boolean;
  enableVersioning?: boolean;
  enableLinting?: boolean;
}

const defaultVisualFiles = {
  "index.html": `<div id="app"></div>`,
  "index.css": `#app { 
  color: #00ff41; 
  font-size: 2rem; 
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 20px;
}`,
  "index.js": `document.getElementById("app").textContent = main();`,
};

const defaultAttachedFiles: AttachedFile[] = [
  {
    name: "styles.css",
    content: `/* Add your CSS styles here */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}`,
    language: "css"
  },
  {
    name: "script.js",
    content: `// Add your JavaScript here
function helper() {
  console.log("Helper function called");
}`,
    language: "javascript"
  },
  {
    name: "template.html",
    content: `<!-- Add your HTML template here -->
<div class="template">
  <h1>Template Content</h1>
</div>`,
    language: "html"
  }
];

const useAdvancedIDE = <T,>(props: IDEProps<T>) => {
  const [code, setCode] = useState("");
  const [outputs, setOutputs] = useState<IDEOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<DocumentId | null>(null);

  // Visual mode states
  const [visualFiles, setVisualFiles] = useState(props.visualFiles || defaultVisualFiles);
  const [activeVisualTab, setActiveVisualTab] = useState<VisualTab>("index.html");
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTab>("console");
  const [iframeKey, setIframeKey] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  // Attached files states
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    props.attachedFiles || defaultAttachedFiles
  );
  const [activeAttachedFile, setActiveAttachedFile] = useState<string>("styles.css");
  const [showAttachedFiles, setShowAttachedFiles] = useState(false);

  // Initialize with template or default
  useEffect(() => {
    if (props.templates && props.defaultTemplate) {
      const template = props.templates.find(t => t.id === props.defaultTemplate);
      if (template) {
        setCode(template.defaultCode);
        setActiveTemplate(template.id);
      }
    }
  }, [props.templates, props.defaultTemplate]);

  // Sync visual files with props
  useEffect(() => {
    if (props.visualFiles) {
      setVisualFiles(props.visualFiles);
    }
  }, [props.visualFiles]);

  // Sync attached files with props
  useEffect(() => {
    if (props.attachedFiles) {
      setAttachedFiles(props.attachedFiles);
    }
  }, [props.attachedFiles]);

  const addOutput = useCallback((output: Omit<IDEOutput, "id" | "timestamp">) => {
    const newOutput: IDEOutput = {
      ...output,
      id: Date.now(),
      timestamp: Date.now(),
    };
    setOutputs(prev => [...prev, newOutput]);
  }, []);

  const clearOutputs = useCallback(() => {
    setOutputs([]);
    setHasRun(false);
  }, []);

  const executeCodeMode = useCallback(async () => {
    if (!props.onExecute) {
      // Default code execution for demonstration
      try {
        // Include attached files in execution context
        let fullCode = "";

        // Add CSS as a style element
        const cssFiles = attachedFiles.filter(f => f.language === "css");
        if (cssFiles.length > 0) {
          const cssContent = cssFiles.map(f => f.content).join("\n");
          fullCode += `
            const style = document.createElement('style');
            style.textContent = \`${cssContent}\`;
            document.head.appendChild(style);
          `;
        }

        // Add HTML content
        const htmlFiles = attachedFiles.filter(f => f.language === "html");
        if (htmlFiles.length > 0) {
          const htmlContent = htmlFiles.map(f => f.content).join("\n");
          fullCode += `
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = \`${htmlContent}\`;
          `;
        }

        // Add JavaScript helpers
        const jsFiles = attachedFiles.filter(f => f.language === "javascript");
        jsFiles.forEach(file => {
          fullCode += `\n${file.content}\n`;
        });

        // Add main code
        fullCode += `\n${code}\n`;

        const func = new Function(fullCode + '\n; return typeof main === "function" ? main() : "No main function found";');
        const result = func();
        addOutput({ type: "result", message: `Return value: ${String(result)}` });
      } catch (error) {
        addOutput({
          type: "error",
          message: error instanceof Error ? error.message : String(error)
        });
      }
      return;
    }

    const result = await props.onExecute(code, props.data);
    if (Array.isArray(result)) {
      result.forEach(output => addOutput(output));
    }
  }, [code, attachedFiles, props.data, props.onExecute, addOutput]);

  const executeVisualMode = useCallback(() => {
    setIframeKey(k => k + 1); // Force iframe re-render
    setActiveOutputTab("preview"); // Auto-switch to preview tab
    addOutput({ type: "result", message: "Visual project rendered successfully." });
  }, [addOutput]);

  const executeCode = useCallback(async () => {
    setIsLoading(true);
    setStatus("Executing...");
    clearOutputs();

    addOutput({ type: "log", message: ">>> Starting execution..." });

    try {
      if (props.config.mode === "code") {
        await executeCodeMode();
      } else {
        executeVisualMode();
      }
      setStatus("Execution completed");
      setHasRun(true);
    } catch (error) {
      addOutput({
        type: "error",
        message: error instanceof Error ? error.message : String(error)
      });
      setStatus("Execution failed");
    } finally {
      setIsLoading(false);
    }
  }, [props.config.mode, executeCodeMode, executeVisualMode, addOutput, clearOutputs]);

  const saveCode = useCallback(async () => {
    if (!props.onSave) return;

    setIsLoading(true);
    setStatus("Saving...");

    try {
      await props.onSave(code, props.data);
      setStatus("Saved successfully");
      addOutput({ type: "log", message: "Code saved successfully" });
    } catch (error) {
      addOutput({
        type: "error",
        message: `Save failed: ${error instanceof Error ? error.message : String(error)}`
      });
      setStatus("Save failed");
    } finally {
      setIsLoading(false);
    }
  }, [code, props.data, props.onSave, addOutput]);

  const loadTemplate = useCallback((templateId: DocumentId) => {
    const template = props.templates?.find(t => t.id === templateId);
    if (template) {
      setCode(template.defaultCode);
      setActiveTemplate(templateId);
      clearOutputs();
      addOutput({ type: "log", message: `Loaded template: ${template.name}` });
    }
  }, [props.templates, addOutput, clearOutputs]);

  const updateVisualFile = useCallback((fileName: VisualTab, content: string) => {
    const newFiles = { ...visualFiles, [fileName]: content };
    setVisualFiles(newFiles);
    props.onVisualFilesChange?.(newFiles);
  }, [visualFiles, props]);

  const updateAttachedFile = useCallback((fileName: string, content: string) => {
    const newFiles = attachedFiles.map(file =>
      file.name === fileName ? { ...file, content } : file
    );
    setAttachedFiles(newFiles);
    props.onAttachedFilesChange?.(newFiles);
  }, [attachedFiles, props]);

  const addNewAttachedFile = useCallback(() => {
    const newFileName = `new-file-${Date.now()}.js`;
    const newFile: AttachedFile = {
      name: newFileName,
      content: "// New file content",
      language: "javascript"
    };
    const newFiles = [...attachedFiles, newFile];
    setAttachedFiles(newFiles);
    setActiveAttachedFile(newFileName);
    props.onAttachedFilesChange?.(newFiles);
  }, [attachedFiles, props]);

  const removeAttachedFile = useCallback((fileName: string) => {
    const newFiles = attachedFiles.filter(file => file.name !== fileName);
    setAttachedFiles(newFiles);
    if (activeAttachedFile === fileName && newFiles.length > 0) {
      setActiveAttachedFile(newFiles[0].name);
    }
    props.onAttachedFilesChange?.(newFiles);
  }, [attachedFiles, activeAttachedFile, props]);

  return {
    code,
    setCode,
    outputs,
    isLoading,
    status,
    activeTemplate,
    visualFiles,
    activeVisualTab,
    setActiveVisualTab,
    activeOutputTab,
    setActiveOutputTab,
    iframeKey,
    hasRun,
    executeCode,
    saveCode,
    loadTemplate,
    addOutput,
    clearOutputs,
    updateVisualFile,
    attachedFiles,
    activeAttachedFile,
    setActiveAttachedFile,
    showAttachedFiles,
    setShowAttachedFiles,
    updateAttachedFile,
    addNewAttachedFile,
    removeAttachedFile
  };
};

export function IdeEditor<T = any>(props: IDEProps<T>) {
  const {
    code,
    setCode,
    outputs,
    isLoading,
    status,
    activeTemplate,
    visualFiles,
    activeVisualTab,
    setActiveVisualTab,
    activeOutputTab,
    setActiveOutputTab,
    iframeKey,
    hasRun,
    executeCode,
    saveCode,
    loadTemplate,
    clearOutputs,
    updateVisualFile,
    attachedFiles,
    activeAttachedFile,
    setActiveAttachedFile,
    showAttachedFiles,
    setShowAttachedFiles,
    updateAttachedFile,
    addNewAttachedFile,
    removeAttachedFile
  } = useAdvancedIDE(props);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const editorOptions = useMemo(() => ({
    minimap: { enabled: props.config.showMinimap ?? false },
    fontSize: 14,
    lineHeight: 1.6,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: "on" as const,
    readOnly: props.config.readOnly ?? false,
    formatOnPaste: true,
    formatOnType: true,
  }), [props.config.showMinimap, props.config.readOnly]);

  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    props.onDataChange?.({ ...props.data, code: newCode } as T);
  }, [setCode, props]);

  const handleVisualFileChange = useCallback((value: string | undefined) => {
    updateVisualFile(activeVisualTab, value || "");
  }, [activeVisualTab, updateVisualFile]);

  const handleAttachedFileChange = useCallback((value: string | undefined) => {
    updateAttachedFile(activeAttachedFile, value || "");
  }, [activeAttachedFile, updateAttachedFile]);

  const handleModeChange = useCallback((newMode: "code" | "visual") => {
    clearOutputs();
    setActiveOutputTab("console");
    if (props.onDataChange) {
      props.onDataChange({ ...props.data, config: { ...props.config, mode: newMode } } as T);
    }
  }, [clearOutputs, setActiveOutputTab, props]);

  // Auto-run feature
  useEffect(() => {
    if (props.config.autoRun && code && !isLoading) {
      const timeoutId = setTimeout(executeCode, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [code, props.config.autoRun, executeCode, isLoading]);

  // Generate iframe HTML for visual mode
  const getVisualIframeHtml = useCallback(() => {
    // Include attached CSS and HTML files
    const cssFiles = attachedFiles.filter(f => f.language === "css");
    const htmlFiles = attachedFiles.filter(f => f.language === "html");
    const jsFiles = attachedFiles.filter(f => f.language === "javascript");

    const attachedCSS = cssFiles.map(f => f.content).join("\n");
    const attachedHTML = htmlFiles.map(f => f.content).join("\n");
    const attachedJS = jsFiles.map(f => f.content).join("\n");

    return `
    <html>
      <head>
        <style>
          ${visualFiles["index.css"]}
          ${attachedCSS}
        </style>
      </head>
      <body>
        ${visualFiles["index.html"]}
        ${attachedHTML}
        <script>
          try {
            ${attachedJS}
            ${code}
            ${visualFiles["index.js"]}
          } catch (e) {
            document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: ' + e.message + '</div>';
          }
        </script>
      </body>
    </html>
  `;
  }, [visualFiles, code, attachedFiles]);

  // Get current attached file
  const currentAttachedFile = attachedFiles.find(f => f.name === activeAttachedFile);

  // Console output component
  const ConsoleOutput = useMemo(() => (
    <div className="bg-black text-green-400 font-mono text-sm">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <span>Console</span>
        <div className="flex gap-2">
          {status && (
            <span className="text-yellow-400 text-xs">
              Status: {status}
            </span>
          )}
          <button
            onClick={clearOutputs}
            className="text-xs bg-gray-800 px-2 py-1 rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="p-3 h-80 overflow-y-auto">
        {outputs.length === 0 ? (
          <div className="text-gray-600">Ready to execute...</div>
        ) : (
          outputs.map((output, index) => (
            <div key={index} className={`mb-1 ${output.type === 'error' ? 'text-red-400' :
              output.type === 'warning' ? 'text-yellow-400' :
                output.type === 'result' ? 'text-blue-400' :
                  'text-green-400'
              }`}>
              <span className="text-gray-500 text-xs">
                [{new Date(output.timestamp).toLocaleTimeString()}]
              </span>
              {' '}
              <span className="text-gray-400 text-xs">
                [{output.type.toUpperCase()}]
              </span>
              {' '}
              {output.message}
            </div>
          ))
        )}
      </div>
    </div>
  ), [outputs, status, clearOutputs]);

  // Preview output component
  const PreviewOutput = useMemo(() => (
    <div className="h-80 bg-white">
      {props.config.mode === "visual" && hasRun ? (
        <iframe
          key={iframeKey}
          ref={iframeRef}
          title="Visual Project Preview"
          width="100%"
          height="100%"
          className="bg-white"
          sandbox="allow-scripts"
          srcDoc={getVisualIframeHtml()}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          {props.config.mode === "code" ?
            "Preview is only available in Visual Mode" :
            hasRun ? "Loading preview..." : "Click 'Run' to see preview"
          }
        </div>
      )}
    </div>
  ), [props.config.mode, hasRun, iframeKey, getVisualIframeHtml]);

  return (
    <div className={`bg-white rounded-xl shadow-lg border ${props.className || ""}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {props.title || "Advanced IDE"}
          </h2>

          <div className="flex items-center gap-4">
            {/* Mode Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Mode:</label>
              <select
                value={props.config.mode}
                onChange={(e) => handleModeChange(e.target.value as "code" | "visual")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="code">Code Mode</option>
                <option value="visual">Visual Mode</option>
              </select>
            </div>

            {/* Template Selector */}
            {props.templates && (
              <select
                value={activeTemplate || ""}
                onChange={(e) => loadTemplate(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Template</option>
                {props.templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {props.onSave && (
                <button
                  onClick={saveCode}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Save
                </button>
              )}

              <button
                onClick={executeCode}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Running..." : "Run"}
              </button>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {props.data && (
          <div className="mt-2 text-sm text-gray-600">
            <strong>Context:</strong> {JSON.stringify(props.data, null, 2)}
          </div>
        )}
      </div>

      {/* Main Editor */}
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Editor (main.js)
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height={props.height || "300px"}
              language={props.config.language}
              value={code}
              onChange={handleCodeChange}
              options={editorOptions}
              theme={props.config.theme || "vs-dark"}
            />
          </div>
        </div>

        {/* Attached Files Section (Accordion) */}
        <div className="mb-4">
          <button
            onClick={() => setShowAttachedFiles(!showAttachedFiles)}
            className="flex items-center gap-2 w-full p-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showAttachedFiles ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium text-gray-700">
              Attached Files ({attachedFiles.length})
            </span>
          </button>

          {showAttachedFiles && (
            <div className="mt-2 border border-gray-300 rounded-lg overflow-hidden">
              {/* Attached Files Tabs */}
              <div className="flex items-center justify-between border-b bg-gray-50">
                <div className="flex overflow-x-auto">
                  {attachedFiles.map((file) => (
                    <button
                      key={file.name}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium border-r whitespace-nowrap ${activeAttachedFile === file.name
                          ? "bg-white text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-800"
                        }`}
                      onClick={() => setActiveAttachedFile(file.name)}
                    >
                      {file.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachedFile(file.name);
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                </div>
                <button
                  onClick={addNewAttachedFile}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border-l"
                >
                  + Add File
                </button>
              </div>

              {/* Attached File Editor */}
              {currentAttachedFile && (
                <Editor
                  height="250px"
                  language={currentAttachedFile.language}
                  value={currentAttachedFile.content}
                  onChange={handleAttachedFileChange}
                  options={editorOptions}
                  theme={props.config.theme || "vs-dark"}
                />
              )}
            </div>
          )}
        </div>

        {/* Visual Mode Editors */}
        {props.config.mode === "visual" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Files
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Visual Tabs */}
              <div className="flex border-b bg-gray-50">
                {(["index.html", "index.css", "index.js"] as VisualTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`px-4 py-2 text-sm font-medium border-r ${activeVisualTab === tab
                        ? "bg-white text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                      }`}
                    onClick={() => setActiveVisualTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Visual Editor */}
              <Editor
                height="250px"
                language={
                  activeVisualTab === "index.html" ? "html" :
                    activeVisualTab === "index.css" ? "css" : "javascript"
                }
                value={visualFiles[activeVisualTab]}
                onChange={handleVisualFileChange}
                options={editorOptions}
                theme={props.config.theme || "vs-dark"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Output Section with Tabs */}
      <div className="border-t">
        {/* Output Tabs */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-sm font-medium border-r ${activeOutputTab === "console"
                ? "bg-black text-green-400 border-b-2 border-green-400"
                : "bg-gray-50 text-gray-600 hover:text-gray-800"
              }`}
            onClick={() => setActiveOutputTab("console")}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              Console
            </span>
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-r ${activeOutputTab === "preview"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "bg-gray-50 text-gray-600 hover:text-gray-800"
              } ${props.config.mode === "code" ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => setActiveOutputTab("preview")}
            disabled={props.config.mode === "code"}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Preview
              {props.config.mode === "code" && (
                <span className="text-xs">(Visual Mode Only)</span>
              )}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="border border-gray-300 border-t-0 rounded-b-lg overflow-hidden">
          {activeOutputTab === "console" && ConsoleOutput}
          {activeOutputTab === "preview" && PreviewOutput}
        </div>
      </div>
    </div>
  );
}
