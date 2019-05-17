module.exports = {
  "parser": "@typescript-eslint/parser",
  "env": {
    "es6": true,
    "browser": true
  },
  "extends": [
    "airbnb"
  ],
  "globals": {
    "__DEV__": true
  },
  "plugins": [
    "@typescript-eslint",
    "react-hooks"
  ],
  "parserOptions": {
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "settings": {
    "import/extensions": [
      ".js",
      ".jsx",
      ".ts",
      ".tsx"
    ],
    "import/core-modules": [
      "app"
    ],
    "import/resolver": {
      "node": {
        "extensions": [
          ".js",
          ".jsx",
          ".ts",
          ".tsx"
        ]
      }
    }
  },
  "rules": {
    "react/prop-types": [
      0
    ],
    "react-hooks/rules-of-hooks": "error",
    "react/jsx-filename-extension": [
      "error",
      {
        "extensions": [
          ".js",
          ".jsx",
          ".ts",
          ".tsx"
        ]
      }
    ],
    "import/extensions": [
      "error", "always",
      {
        "js": "never",
        "jsx": "never",
        "ts": "never",
        "tsx": "never"
      }
    ],
    "no-multi-spaces": 0,
    "key-spacing": 0,
    "lines-between-class-members": 0,
    "camelcase": 0,
    "no-tabs": 0,
    "max-len": 0,
    "class-methods-use-this": 0,
  }
}