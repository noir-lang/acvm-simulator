#![warn(unused_crate_dependencies, unused_extern_crates)]
#![warn(unreachable_pub)]


use thiserror::Error;
use gloo_utils::format::JsValueSerdeExt;
use js_sys::Map;
use log::Level;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

mod abi;
mod execute;
mod js_transforms;
mod barretenberg_structures;
mod barretenberg;
mod pedersen;

pub use abi::{abi_decode, abi_encode};
pub use execute::execute_circuit;

use acvm::acir::BlackBoxFunc;

#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Error)]
enum Error {
    #[error("The value {0} overflows in the pow2ceil function")]
    Pow2CeilOverflow(u32),

    #[error("Malformed Black Box Function: {0} - {1}")]
    MalformedBlackBoxFunc(BlackBoxFunc, String),

    #[error("Unsupported Black Box Function: {0}")]
    UnsupportedBlackBoxFunc(BlackBoxFunc),

    #[error(transparent)]
    FromFeature(#[from] FeatureError),

}

#[derive(Debug, Error)]
enum FeatureError {
    #[error("Trying to call {name} resulted in an error")]
    FunctionCallFailed {
        name: String,
        source: wasmer::RuntimeError,
    },
    #[error("Could not find function export named {name}")]
    InvalidExport {
        name: String,
        source: wasmer::ExportError,
    },
    #[error("No value available when value was expected")]
    NoValue,
    #[error("Value expected to be i32")]
    InvalidI32,
    #[error("Could not convert value {value} from i32 to u32")]
    InvalidU32 {
        value: i32,
        source: std::num::TryFromIntError,
    },
    #[error("Could not convert value {value} from i32 to usize")]
    InvalidUsize {
        value: i32,
        source: std::num::TryFromIntError,
    },
    #[error("Value expected to be 0 or 1 representing a boolean")]
    InvalidBool,
}
#[derive(Debug, Error)]
#[error(transparent)]
pub struct BackendError(#[from] Error);

impl From<FeatureError> for BackendError {
    fn from(value: FeatureError) -> Self {
        value.into()
    }
}

#[derive(Serialize, Deserialize)]
pub struct BuildInfo {
    git_hash: &'static str,
    version: &'static str,
    dirty: &'static str,
}

#[wasm_bindgen]
pub fn init_log_level(level: String) {
    // Set the static variable from Rust
    use std::sync::Once;

    let log_level = Level::from_str(&level).unwrap_or(Level::Error);
    static SET_HOOK: Once = Once::new();
    SET_HOOK.call_once(|| {
        wasm_logger::init(wasm_logger::Config::new(log_level));
    });
}

const BUILD_INFO: BuildInfo = BuildInfo {
    git_hash: env!("GIT_COMMIT"),
    version: env!("CARGO_PKG_VERSION"),
    dirty: env!("GIT_DIRTY"),
};

#[wasm_bindgen(js_name = buildInfo)]
pub fn build_info() -> JsValue {
    console_error_panic_hook::set_once();
    <JsValue as JsValueSerdeExt>::from_serde(&BUILD_INFO).unwrap()
}

#[wasm_bindgen(typescript_custom_section)]
const WITNESS_MAP: &'static str = r#"
// Map from witness index to hex string value of witness.
export type WitnessMap = Map<number, string>;
"#;

// WitnessMap
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(extends = Map, js_name = "WitnessMap", typescript_type = "WitnessMap")]
    #[derive(Clone, Debug, PartialEq, Eq)]
    pub type JsWitnessMap;

    #[wasm_bindgen(constructor, js_class = "Map")]
    pub fn new() -> JsWitnessMap;

}

impl Default for JsWitnessMap {
    fn default() -> Self {
        Self::new()
    }
}
