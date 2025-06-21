"use client";

import TiptapEditor, { TiptapEditorRef } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import "./styles.scss"; // Ensure you have the correct path to your styles

const formSchema = z.object({
  content: z.string().optional(),
});

const sampleContent = `
<h2>Interactive Code Blocks</h2>
<p>Try the code blocks below - click the play button to execute them!</p>

<h3>JavaScript Example</h3>
<pre data-language="javascript"><code>// Calculate fibonacci numbers
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log("Fibonacci sequence:");
for (let i = 0; i < 8; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}

return "Fibonacci calculation complete!";</code></pre>

<h3>Simple Math</h3>
<pre data-language="javascript"><code>const a = 5;
const b = 10;
const sum = a + b;

console.log(\`\${a} + \${b} = \${sum}\`);
console.log("Math operations work!");

return sum;</code></pre>

<h3>Python Example (Mock)</h3>
<pre data-language="python"><code>def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("This is a Python example")</code></pre>
`;

export default function Page() {
  const editorRef = useRef<TiptapEditorRef>(null);  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: sampleContent
    }
  });
  return (
    <>

      <Button
        onClick={() => {
          console.log(form.getValues());
          console.log(editorRef.current!.getInstance()?.getJSON());
        }}
        className="mb-4"
      >
        Save
      </Button>
      <div className="flex h-full w-full items-center justify-center">
        <Controller
          control={form.control}
          name="content"
          render={({ field }) => (
            <TiptapEditor
              ref={editorRef}
              ssr={true}
              output="html"
              placeholder={{
                paragraph: "Type your content here...",
                imageCaption: "Type caption for image (optional)",
              }}
              contentMinHeight={256}
              contentMaxHeight={640}
              onContentChange={field.onChange}
              initialContent={field.value}
            />
          )}
        />
      </div>
    </>
  );
}
