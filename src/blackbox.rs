use acvm::{acir::native_types::WitnessMap, pwg::hash};
use js_sys::JsString;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub fn keccak256(input: Vec<u8>) -> Result<Vec<u8>, JsString> {
    console_error_panic_hook::set_once();

    let digest = hash::keccak256(input)?;
    Ok(digest)
}

#[wasm_bindgen]
pub fn blake2s256(input: Vec<u8>) -> Result<Vec<u8>, JsString> {
    console_error_panic_hook::set_once();

    let digest = hash::blake2s256(input)?;
    Ok(digest)
}

#[wasm_bindgen]
pub fn sha256(input: Vec<u8>) -> Result<Vec<u8>, JsString> {
    console_error_panic_hook::set_once();

    let digest = hash::sha256(input)?;
    Ok(digest)
}
