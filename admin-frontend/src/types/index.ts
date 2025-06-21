export type DocumentId = number;
export interface DocumentBase {
    id: DocumentId;
    created_at?: string;
    updated_at?: string;
}
export type FieldItem = {
    label: string;
    value: string;
};

export interface IDETemplate extends DocumentBase {
    name: string;
    language: string;
    defaultCode: string;
    description?: string;
}

export interface IDEConfig extends DocumentBase {
    mode: "code" | "visual";
    language: string;
    theme?: "vs-dark" | "light";
    readOnly?: boolean;
    showMinimap?: boolean;
    autoRun?: boolean;
}

export interface IDEOutput extends DocumentBase {
    type: "log" | "error" | "result" | "warning";
    message: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface Task extends DocumentBase {
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed" | "failed";
    priority: "low" | "medium" | "high";
    assignedTo?: string;
    code?: string;
    testCases?: TestCase[];
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}

export interface TestCase extends DocumentBase {
    name: string;
    input: any;
    expectedOutput: any;
    actualOutput?: any;
    passed?: boolean;
}