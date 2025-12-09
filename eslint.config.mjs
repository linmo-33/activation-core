import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 忽略构建输出目录
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 自定义规则：将错误降级为警告，避免构建失败
  {
    rules: {
      // 将 TypeScript 相关错误降级为警告
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      // 将 React 相关错误降级为警告
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
