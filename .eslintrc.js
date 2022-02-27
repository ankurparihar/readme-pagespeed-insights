module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2015,
    },
    plugins: ["@typescript-eslint", "import"],
    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": [".ts", ".tsx"],
        },
    },
    rules: {
        "import/order": [
            "error",
            {
                "alphabetize": { order: "asc", caseInsensitive: true },
                "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
                "newlines-between": "always",
            },
        ],
    },
};
