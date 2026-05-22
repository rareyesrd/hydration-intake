import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts", "public/sw.js"]
  },
  ...nextVitals,
  ...nextTypescript,
  prettier
];

export default eslintConfig;
