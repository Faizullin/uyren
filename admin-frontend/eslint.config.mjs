import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),



  // MY: Disable the no-explicit-any rule in TypeScript
  {
    rules: {
      // Option 1: Disable the rule completely
      "@typescript-eslint/no-explicit-any": "off"

      // Option 2: Change the rule to a warning
      // "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];

export default eslintConfig;
