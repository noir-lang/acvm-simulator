#!/usr/bin/env bash


# Clear out the existing build artifacts as these aren't automatically removed by wasm-pack.
if [ -d ./pkg/ ]; then
    rm -rf ./pkg/
fi

# Build the new wasm package
cargo build --lib --release --target wasm32-unknown-unknown
wasm-bindgen ./target/wasm32-unknown-unknown/release/acvm_simulator.wasm --out-dir ./pkg/nodejs --typescript --target nodejs
wasm-bindgen ./target/wasm32-unknown-unknown/release/acvm_simulator.wasm --out-dir ./pkg/web --typescript --target web
wasm-opt ./pkg/nodejs/acvm_simulator_bg.wasm -o ./pkg/nodejs/acvm_simulator_bg.wasm -O
wasm-opt ./pkg/web/acvm_simulator_bg.wasm -o ./pkg/web/acvm_simulator_bg.wasm -O
