import { ensureDir } from "./deps.ts";
import { lambdaGenerator } from "./core/lamda.ts";
import { tsConfig } from "./core/tsconfig.ts";
import type { Schema, CodegenOptions } from "./types.ts";

export async function codegen(options?: CodegenOptions) {
  const apiBuildPath =
    options?.apiBuildPath ?? Deno.env.get("API_BUILD_PATH") ?? "./pages/api";
  const schemasPath =
    options?.schemasPath ?? Deno.env.get("API_SCHEMAS_PATH") ?? "./schemas";
  const mocksPath =
    options?.mocksPath ?? Deno.env.get("API_MOCKS_PATH") ?? "../mocks/";

  await ensureDir(apiBuildPath);
  await Deno.writeTextFile(`${apiBuildPath}/tsconfig.json`, tsConfig);

  for await (const dirEntry of Deno.readDirSync(schemasPath)) {
    const schemaPath = `${schemasPath}/${dirEntry.name}`;
    if (schemaPath.includes(".json")) {
      const schema = JSON.parse(Deno.readTextFileSync(schemaPath));

      if (!schema.endpoints) {
        throw "Endpoints array required in json file";
      }

      schema.endpoints.forEach(async (scheme: Schema) => {
        await Deno.writeTextFile(
          `${apiBuildPath}/${scheme.path}.ts`,
          await lambdaGenerator(scheme, {
            apiHost: options?.apiHost,
            mocksPath,
          })
        );
      });
    }
  }
}
