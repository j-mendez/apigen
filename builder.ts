import { cliParse, ensureDir } from "./deps.ts";
import { lambdaGenerator } from "./core/lamda.ts";
import { tsConfig } from "./core/tsconfig.ts";
import type { Schema } from "./types.ts";

const args = cliParse(Deno.args);

export async function codegen() {
  const apiPath =
    args?.apiPath ?? Deno.env.get("API_BUILD_PATH") ?? "./pages/api";
  const schemasPath =
    args?.schemaPath ?? Deno.env.get("API_SCHEMAS_PATH") ?? "./schemas";

  await ensureDir(apiPath);
  await Deno.writeTextFile(`${apiPath}/tsconfig.json`, tsConfig);

  for await (const dirEntry of Deno.readDirSync(schemasPath)) {
    const schemaPath = `./schemas/${dirEntry.name}`;
    if (schemaPath.includes(".json")) {
      const schema = JSON.parse(Deno.readTextFileSync(schemaPath));

      if (!schema.endpoints) {
        throw "Endpoints array required in json file";
      }

      schema.endpoints.forEach(async (scheme: Schema) => {
        await Deno.writeTextFile(
          `${apiPath}/${scheme.path}.ts`,
          await lambdaGenerator(scheme)
        );
      });
    }
  }
}

export async function main(name: string) {
  await codegen();
  return `Codegen starting for ${name}`;
}

if (args?.formula === "init") {
  console.log(await main(Deno.env.get("APP_NAME") ?? "apigen"));
} else {
  console.log(
    "Your missing arguements, try adding --formula init to get started or check out the docs for valid options."
  );
}
