import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/features/application-tracker/**/*.tsx",
      "src/features/dashboard/**/*.tsx",
      "src/features/profile/**/*.tsx",
      "src/features/resume-analyzer/**/*.tsx",
      "src/features/study-quiz/**/*.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/oklch\\(/i]",
          message:
            "Feature components must use CSS variable-backed Tailwind tokens instead of hardcoded oklch colors.",
        },
        {
          selector: "TemplateElement[value.raw=/oklch\\(/i]",
          message:
            "Feature components must use CSS variable-backed Tailwind tokens instead of hardcoded oklch colors.",
        },
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Feature components must use CSS variable-backed Tailwind tokens instead of hardcoded hex colors.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Feature components must use CSS variable-backed Tailwind tokens instead of hardcoded hex colors.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
