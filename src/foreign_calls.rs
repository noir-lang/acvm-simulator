use acvm::{
    acir::brillig_vm::{ForeignCallResult, Value},
    pwg::ForeignCallWaitInfo,
    FieldElement,
};

use iter_extended::vecmap;
use js_sys::JsString;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::js_witness_map::{field_element_to_js_string, js_value_to_field_element};

#[wasm_bindgen(typescript_custom_section)]
const FOREIGN_CALL_HANDLER: &'static str = r#"
/**
* A callback which performs an foreign call and returns the response.
* @callback ForeignCallHandler
* @param {string} name - The identifier for the type of foreign call being performed.
* @param {string[]} inputs - An array of hex encoded inputs to the foreign call.
* @returns {Promise<string[]>} outputs - An array of hex encoded outputs containing the results of the foreign call.
*/
export type ForeignCallHandler = (name: string, inputs: string[]) => Promise<string[]>;
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(extends = js_sys::Function, typescript_type = "ForeignCallHandler")]
    pub type ForeignCallHandler;
}

pub(super) async fn resolve_brillig(
    foreign_call_callback: &ForeignCallHandler,
    foreign_call_wait_info: &ForeignCallWaitInfo,
) -> Result<ForeignCallResult, String> {
    // Prepare to call
    let (name, inputs) = prepare_brillig_args(foreign_call_wait_info);

    // Perform foreign call
    let outputs = perform_foreign_call(foreign_call_callback, name, inputs).await?;
    let outputs: Vec<Value> = vecmap(outputs, |output| output.into());
    // The Brillig VM checks that the number of return values from
    // the foreign call is valid so we don't need to do it here.
    Ok(outputs.into())
}

fn prepare_brillig_args(brillig_call_info: &ForeignCallWaitInfo) -> (JsString, js_sys::Array) {
    let function = JsString::from(brillig_call_info.function.clone());

    // Flatten all the args into one field array
    let inputs = js_sys::Array::default();
    for input_array in &brillig_call_info.inputs {
        for input in input_array {
            let hex_js_string = field_element_to_js_string(&input.to_field());
            inputs.push(&hex_js_string);
        }
    }

    (function, inputs)
}

#[allow(dead_code)]
async fn perform_foreign_call(
    foreign_call_handler: &ForeignCallHandler,
    name: JsString,
    inputs: js_sys::Array,
) -> Result<Vec<FieldElement>, String> {
    // Call and await
    let this = JsValue::null();
    let ret_js_val = foreign_call_handler
        .call2(&this, &name, &inputs)
        .map_err(|err| format!("Error calling `foreign_call_callback`: {}", format_js_err(err)))?;
    let ret_js_prom: js_sys::Promise = ret_js_val.into();
    let ret_future: wasm_bindgen_futures::JsFuture = ret_js_prom.into();
    let js_resolution = ret_future
        .await
        .map_err(|err| format!("Error awaiting `foreign_call_handler`: {}", format_js_err(err)))?;

    // Check that result conforms to expected shape.
    if !js_resolution.is_array() {
        return Err("`foreign_call_handler` must return a Promise<string[]>".into());
    }
    let js_arr = js_sys::Array::from(&js_resolution);

    let mut outputs = Vec::with_capacity(js_arr.length() as usize);
    for elem in js_arr.iter() {
        if !elem.is_string() {
            return Err("Non-string element in oracle_resolver return".into());
        }
        outputs.push(js_value_to_field_element(elem)?)
    }

    Ok(outputs)
}

#[allow(dead_code)]
fn format_js_err(err: JsValue) -> String {
    match err.as_string() {
        Some(str) => str,
        None => "Unknown".to_owned(),
    }
}
