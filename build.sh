#!/bin/bash

curl -fsSL https://deno.land/x/install/install.sh | sh -s v1.10.3

NODE_ENV=$1

alias _deno='deno'

if [ "$NODE_ENV" == "production" ]; then
    export DENO_INSTALL="/vercel/.deno"
    export PATH="$DENO_INSTALL/bin:$PATH"
    _deno="/vercel/.deno/bin/deno"
else
	_deno="deno"
fi


$_deno run --allow-read --allow-env --allow-net --unstable --allow-run --allow-write ./builder.ts --formula init

