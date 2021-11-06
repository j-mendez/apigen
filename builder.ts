import { cliParse, ensureDir } from "./deps.ts";
import { lambdaGenerator } from "./core/lamda.ts";
import { tsConfig } from "./core/tsconfig.ts";
import type { Schema, CodegenOptions } from "./types.ts";

const args = cliParse(Deno.args);

export async function codegen(options?: CodegenOptions) {
  const apiBuildPath =
    options?.apiBuildPath ??
    args?.apiBuildPath ??
    Deno.env.get("API_BUILD_PATH") ??
    "./pages/api";
  const schemasPath =
    options?.schemaPath ??
    args?.schemaPath ??
    Deno.env.get("API_SCHEMAS_PATH") ??
    "./schemas";

  await ensureDir(apiBuildPath);
  await Deno.writeTextFile(`${apiBuildPath}/tsconfig.json`, tsConfig);

  for await (const dirEntry of Deno.readDirSync(schemasPath)) {
    const schemaPath = `./schemas/${dirEntry.name}`;
    if (schemaPath.includes(".json")) {
      const schema = JSON.parse(Deno.readTextFileSync(schemaPath));

      if (!schema.endpoints) {
        throw "Endpoints array required in json file";
      }

      schema.endpoints.forEach(async (scheme: Schema) => {
        await Deno.writeTextFile(
          `${apiBuildPath}/${scheme.path}.ts`,
          await lambdaGenerator(scheme)
        );
      });
    }
  }
}

export async function main() {
  await codegen();
  return `Codegen starting for ${Deno.env.get("APP_NAME") ?? "apigen"}`;
}

if (args?.formula === "init") {
  console.log(await main());
} else {
  console.log(
    "Your missing arguements, try adding --formula init to get started or check out the docs for valid options."
  );
}
