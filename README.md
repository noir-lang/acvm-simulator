# ACVM Simulator

The ACVM Simulator enables users to simulate a Noir program, i.e. executing it and generating partial witness (for subsequent proving of the execution).

Note: A number of ACIR opcodes do not currently have rust implementations and so the ACVM simulator does not support them.

## Dependencies

In order to build the wasm package, the following must be installed:

- [wasm-pack](https://github.com/rustwasm/wasm-pack)
- [jq](https://github.com/stedolan/jq)

## Build

The wasm package can be built using the command below:

```bash
./build-wasm
```

Using `wasm-pack` directly isn't recommended as it doesn't generate a complete `package.json` file, resulting in files being omitted from the published package.
