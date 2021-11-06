import { cliParse } from "./deps.ts";
import { codegen } from "./builder.ts";

const args = cliParse(Deno.args);

if (args?.formula === "init") {
  await codegen({
    schemasPath: args?.apiSchemasPath,
    mocksPath: args?.apiMocksPath,
    apiBuildPath: args?.apiBuildPath,
  });
}
