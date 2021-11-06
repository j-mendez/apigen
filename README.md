# apigen

Auto generate api routes for development and production. Use mocks to build api routes for local envs. Works perfect for next.js and deno. The fastest way to build your API and test with confidence.

## Getting Started

Make sure to create a mocks and a schemas directory. Check out the schema section to learn how to build your api. The idea is that the api routes are always checked in `.gitignore` and set at the build level for systems. Its better to setup the module to be used via script to run with pre-install scripts or pre-build scripts - checkout [build.sh](build.sh) for an example. Make sure to add a environmental(.env) variable named `API_HOST` with the url of your api endpoint. If you want to build a mock api set `API_HOST=localhost` to make all endpoints return mock data. If you need to change the route generation paths use the `API_BUILD_PATH` env variable targeting your location.

```typescript
import { codegen } from "https://deno.land/x/apigen/mod.ts";
await codegen();
```

![example](https://i.gyazo.com/c6e581361b1446e7f1f50b700c22b445.gif)

### Configuration

example: `schema`

```json
{
  "endpoints": [
    {
      "path": "/login",
      "url": "auth/api/token",
      "method": "POST",
      "mock": {
        "data": {
          "access_token": "Bearer @Something",
          "refresh_token": ""
        },
        "data:error": {
          "message": "Authentication error, please check your email or password and try again."
        },
        "validator": {
          "fields": [
            { "name": "password", "message": "Password is required." },
            { "name": "username", "message": "User name is required." }
          ]
        }
      }
    }
  ]
}
```

## Mocks

In order to import a mock file add `@import filename` under the `mock.data` key and replace filename with the mock path in the mocks folder. Make sure to export your mock correctly.

```json
{
  "endpoints": [
    {
      "path": "/friends",
      "url": "friends/api/list",
      "method": "GET",
      "mock": {
        "data": "@import friends",
        "data:error": {
          "message": "Access denied."
        }
      }
    }
  ]
}
```

Make sure to export the var named as `mock` in order for the builder to pick it up.

```typescript
export const mock = ["hi", "bye"];
```

## Schema

A json file named of the lambda functions that you are going to create.

TODO: checkout initial schema example.

## CLI

command line args

`--apiBuildPath`
path to create lambda routes
`--schemasPath`
path of schemas to read
`--formula` :options (init)

## Env Variables

1. API_HOST
1. API_BUILD_PATH
1. API_SCHEMAS_PATH
1. API_MOCKS_PATH

## Languages/Support

1. Deno
1. Node
1. Vercel/Next.js
