export interface Language {
  id: string;
  name: string;
  version: string;
  ideoneId: number;
  extensions: string[];
}

export interface ExecutionRequest {
  code: string;
  language: string;
  input?: string;
}

export type ExecutionStatus = 
  | 'success'
  | 'error'
  | 'timeout'
  | 'memory_limit'
  | 'compilation_error'
  | 'runtime_error'
  | 'pending'
  | 'executing';

export interface ExecutionResult {
  status: ExecutionStatus;
  output?: string;
  error?: string;
  compilationInfo?: string;
  executionTime?: number;
  memoryUsed?: string;
  timestamp: number;
  language: string;
}

export interface IdeoneSubmission {
  link: string;
  status: number;
  result?: number;
  output?: string;
  cmpinfo?: string;
  time?: number;
  memory?: string;
}

export interface IdeoneResponse {
  error: string;
  item: Array<{
    key: string;
    value: any[];
  }>;
}

// Ideone language IDs mapping
export const IDEONE_LANGUAGE_MAP: Record<string, number> = {
  'javascript': 56,
  'python': 116,
  'java': 62,
  'cpp': 54,
  'c': 11,
  'csharp': 27,
  'php': 29,
  'ruby': 17,
  'go': 114,
  'rust': 93,
  'swift': 85,
  'kotlin': 75,
  'typescript': 56, // Same as JavaScript for execution
  'bash': 28,
  'sql': 40,
  'r': 80,
  'scala': 39,
  'perl': 3,
  'lua': 26,
  'haskell': 21,
};

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    version: 'Node.js 16.x',
    ideoneId: 56,
    extensions: ['.js']
  },
  {
    id: 'python',
    name: 'Python',
    version: '3.10.x',
    ideoneId: 116,
    extensions: ['.py']
  },
  {
    id: 'java',
    name: 'Java',
    version: '17.x',
    ideoneId: 62,
    extensions: ['.java']
  },
  {
    id: 'cpp',
    name: 'C++',
    version: 'GCC 11.x',
    ideoneId: 54,
    extensions: ['.cpp', '.cc']
  },
  {
    id: 'c',
    name: 'C',
    version: 'GCC 11.x',
    ideoneId: 11,
    extensions: ['.c']
  },
  {
    id: 'csharp',
    name: 'C#',
    version: '.NET 6.x',
    ideoneId: 27,
    extensions: ['.cs']
  },
  {
    id: 'php',
    name: 'PHP',
    version: '8.x',
    ideoneId: 29,
    extensions: ['.php']
  },
  {
    id: 'ruby',
    name: 'Ruby',
    version: '3.x',
    ideoneId: 17,
    extensions: ['.rb']
  },
  {
    id: 'go',
    name: 'Go',
    version: '1.19.x',
    ideoneId: 114,
    extensions: ['.go']
  },
  {
    id: 'rust',
    name: 'Rust',
    version: '1.65.x',
    ideoneId: 93,
    extensions: ['.rs']
  },
  {
    id: 'swift',
    name: 'Swift',
    version: '5.x',
    ideoneId: 85,
    extensions: ['.swift']
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    version: '1.7.x',
    ideoneId: 75,
    extensions: ['.kt']
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    version: 'Node.js 16.x',
    ideoneId: 56, // Compiled to JS
    extensions: ['.ts']
  }
];

// Result code mappings from Ideone API
export const IDEONE_RESULT_CODES: Record<number, ExecutionStatus> = {
  11: 'compilation_error',
  12: 'runtime_error',
  13: 'timeout',
  15: 'success', // Wrong answer becomes success (we'll handle comparison separately)
  17: 'memory_limit',
  19: 'success', // Illegal system call
  20: 'error' // Internal error
};

export const getExecutionStatusFromIdeone = (resultCode: number): ExecutionStatus => {
  return IDEONE_RESULT_CODES[resultCode] || 'error';
};
