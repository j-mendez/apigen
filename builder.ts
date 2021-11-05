import { cliParse, ensureDir } from "./deps.ts";
import { lambdaGenerator } from "./core/lamda.ts";
import { tsConfig } from "./core/tsconfig.ts";
import type { Schema } from "./types.ts";

const args = cliParse(Deno.args);

export async function codegen() {
  const apiPath =
    args?.apiPath ?? Deno.env.get("API_BUILD_PATH") ?? "./pages/api";
  await ensureDir(apiPath);
  Deno.writeTextFile(`${apiPath}/tsconfig.json`, tsConfig);

  for await (const dirEntry of Deno.readDirSync("schemas")) {
    const schemaPath = `./schemas/${dirEntry.name}`;
    if (schemaPath.includes(".json")) {
      const schema = JSON.parse(Deno.readTextFileSync(schemaPath));

      if (!schema.endpoints) {
        throw "Endpoints array required in json file";
      }

      schema.endpoints.forEach(async (scheme: Schema) => {
        const lambda = await lambdaGenerator(scheme);
        Deno.writeTextFile(`${apiPath}/${scheme.path}.ts`, lambda);
      });
    }
  }
}

export function main(name: string): string {
  codegen();
  return "Codegen starting for " + name;
}

if (args?.formula === "init") {
  console.log(main(Deno.env.get("APP_NAME") ?? "apigen"));
} else {
  console.log(
    "Your missing arguements, try adding --formula init to get started or check out the docs for valid options."
  );
}
