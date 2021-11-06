import { cliParse } from "./deps.ts";
import { codegen } from "./builder.ts";

const args = cliParse(Deno.args);

if (args?.formula === "init") {
  console.log(await codegen());
}
