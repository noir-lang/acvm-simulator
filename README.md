# This repository is archived.

Development of `acvm_js` has moved to the main [ACVM repository](https://github.com/noir-lang/acvm/) and can be found [here](https://github.com/noir-lang/acvm/tree/master/acvm_js)

# acvm_js

The `acvm_js` package enables users to execute an ACIR program, i.e. generating an initial witness from a set of inputs and calculating a partial witness. This partial witness can then be used to create a proof of execution using an ACVM backend.

## Dependencies

In order to build the wasm package, the following must be installed:

- [jq](https://github.com/stedolan/jq)

## Build

The wasm package can be built using the command below:

```bash
./build.sh
```
