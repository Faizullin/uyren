interface CodeBlockProps {
    code: string;
    language: string;
}

const CodeBlock = ({ code, language }: CodeBlockProps) => {
    return (
        <pre className={`language-${language}`}>
            <code>
                {code}
            </code>
        </pre>
    );
}

export default CodeBlock;