import type { PlopTypes } from "@turbo/gen";

import { version as dkgPluginsVersion } from "../../../plugins/package.json";
import { version as dkgPluginSwaggerVersion } from "../../../plugin-swagger/package.json";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("package", {
    description: "Adds a new package to the monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the package?",
      },
    ],
    actions: [
      {
        type: "add",
        path: "../{{kebabCase name}}/package.json",
        templateFile: "templates/package-package.json",
      },
      {
        type: "add",
        path: "../{{kebabCase name}}/tsconfig.json",
        templateFile: "templates/package-tsconfig.json",
      },
      {
        type: "add",
        path: "../{{kebabCase name}}/eslint.config.mjs",
        templateFile: "templates/package-eslint.config.mjs",
      },
      {
        type: "add",
        path: "../{{kebabCase name}}/src/index.ts",
        template: "// Your code goes here",
      },
    ],
  });

  plop.setGenerator("plugin", {
    description: "Adds a new DKG plugin package to the monorepo",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name of the plugin?",
      },
    ],
    actions: [
      ...(plop.getGenerator("package").actions as []),
      {
        type: "append",
        path: "../{{kebabCase name}}/package.json",
        pattern: /"dependencies": {(?<insertion>)/g,
        template: `    "@dkg/plugins": "^${dkgPluginsVersion}"\n  `,
      },
      {
        type: "append",
        path: "../{{kebabCase name}}/package.json",
        pattern: /"dependencies": {(?<insertion>)/g,
        template: `    "@dkg/plugin-swagger": "^${dkgPluginSwaggerVersion}",`,
      },
      {
        type: "modify",
        path: "../{{kebabCase name}}/src/index.ts",
        pattern: /.*$/,
        templateFile: "templates/plugin.hbs",
      },
      // Create tests directory and test file
      {
        type: "add",
        path: "../{{kebabCase name}}/tests/{{kebabCase name}}.spec.ts",
        templateFile: "templates/plugin-test.hbs",
      },
    ],
  });
}
