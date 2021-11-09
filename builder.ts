import { ensureDir, XMLtoJSON, CSVtoJSON } from "./deps.ts";
import { lambdaGenerator } from "./core/lamda.ts";
import { tsConfig } from "./core/tsconfig.ts";
import type { Schema, CodegenOptions } from "./types.ts";

/**
 * Get Schema format.
 * @param {schemaText} string
 * @param {xml} boolean
 * @param {csv} boolean
 * @returns {void} System generated files
 */

const getSchema = async (schemaText: string, xml: boolean, csv: boolean) => {
  if (xml) {
    return await XMLtoJSON(schemaText);
  } else if (csv) {
    return await CSVtoJSON(schemaText);
  } else {
    return JSON.parse(schemaText);
  }
};

/**
 * Generate api code.
 * @param {CodegenOptions} options
 * @returns {void} System generated files
 */
export async function codegen(options?: CodegenOptions) {
  const apiBuildPath =
    options?.apiBuildPath ?? Deno.env.get("API_BUILD_PATH") ?? "./pages/api";
  const schemasPath =
    options?.schemasPath ?? Deno.env.get("API_SCHEMAS_PATH") ?? "./schemas";
  const mocksPath =
    options?.mocksPath ?? Deno.env.get("API_MOCKS_PATH") ?? "./mocks/";

  await ensureDir(apiBuildPath);
  await Deno.writeTextFile(`${apiBuildPath}/tsconfig.json`, tsConfig);

  for await (const dirEntry of Deno.readDirSync(schemasPath)) {
    const schemaPath = `${schemasPath}/${dirEntry.name}`;

    if ([".json", ".xml", ".csv"].some((ext) => schemaPath.includes(ext))) {
      const xml = schemaPath.includes(".xml");
      const csv = schemaPath.includes(".csv");

      const schema = await getSchema(
        Deno.readTextFileSync(schemaPath),
        xml,
        csv
      );

      const endpoints = Array.isArray(schema) ? schema : schema?.endpoints;

      if (!endpoints) {
        throw "Endpoints array required in json file";
      }

      endpoints.forEach(async (scheme: Schema) => {
        await Deno.writeTextFile(
          `${apiBuildPath}/${scheme.path ?? Math.random()}.ts`,
          await lambdaGenerator(scheme, {
            apiHost: options?.apiHost,
            mocksPath,
          })
        );
      });
    }
  }
}
