/** @type {import('eslint').Linter.Config} */
const config = {
  extends: [
    "next/core-web-vitals",
    "plugin:tailwindcss/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto",
      },
    ],
  },
  // rules: {
  //   "@next/next/no-html-link-for-pages": "off",
  // },
};

module.exports = config;
