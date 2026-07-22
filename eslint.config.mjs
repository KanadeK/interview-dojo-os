import js from "@eslint/js";
import next from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

const config = [
  ...next,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: [".next/**", "coverage/**", "dist-release/**", "playwright-report/**"] },
];
export default config;
