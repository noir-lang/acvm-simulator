use acvm::{
    acir::{
        circuit::{
            opcodes::{FunctionInput, OracleData},
            Circuit,
        },
        native_types::{Witness, WitnessMap},
        BlackBoxFunc,
    },
    pwg::{
        block::Blocks, hash, logic, range, signature, witness_to_value, OpcodeResolution,
        PartialWitnessGeneratorStatus,
    },
    FieldElement, OpcodeResolutionError, PartialWitnessGenerator,
};

use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

use crate::{
    js_transforms::{field_element_to_js_string, js_value_to_field_element},
    pedersen::Pedersen,
    scalar_mul::ScalarMul,
    schnorr::SchnorrSig,
    Barretenberg, JsWitnessMap,
};

mod merkle;
#[derive(Default)]
struct SimulatedBackend {
    blackbox_vendor: Barretenberg,
}

impl PartialWitnessGenerator for SimulatedBackend {
    fn aes(
        &self,
        _initial_witness: &mut WitnessMap,
        _inputs: &[FunctionInput],
        _outputs: &[Witness],
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        todo!("aes opcode does not have a rust implementation")
    }

    fn and(
        &self,
        initial_witness: &mut WitnessMap,
        lhs: &FunctionInput,
        rhs: &FunctionInput,
        output: &Witness,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        logic::and(initial_witness, lhs, rhs, output)
    }

    fn xor(
        &self,
        initial_witness: &mut WitnessMap,
        lhs: &FunctionInput,
        rhs: &FunctionInput,
        output: &Witness,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        logic::xor(initial_witness, lhs, rhs, output)
    }

    fn range(
        &self,
        initial_witness: &mut WitnessMap,
        input: &FunctionInput,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        range::solve_range_opcode(initial_witness, input)
    }

    fn sha256(
        &self,
        initial_witness: &mut WitnessMap,
        inputs: &[FunctionInput],
        outputs: &[Witness],
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        hash::sha256(initial_witness, inputs, outputs)
    }

    fn blake2s(
        &self,
        initial_witness: &mut WitnessMap,
        inputs: &[FunctionInput],
        outputs: &[Witness],
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        hash::blake2s256(initial_witness, inputs, outputs)
    }

    fn hash_to_field_128_security(
        &self,
        initial_witness: &mut WitnessMap,
        inputs: &[FunctionInput],
        output: &Witness,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        hash::hash_to_field_128_security(initial_witness, inputs, output)
    }

    fn keccak256(
        &self,
        initial_witness: &mut WitnessMap,
        inputs: &[FunctionInput],
        outputs: &[Witness],
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        hash::keccak256(initial_witness, inputs, outputs)
    }

    fn ecdsa_secp256k1(
        &self,
        initial_witness: &mut WitnessMap,
        public_key_x: &[FunctionInput],
        public_key_y: &[FunctionInput],
        signature: &[FunctionInput],
        message: &[FunctionInput],
        outputs: &Witness,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        signature::ecdsa::secp256k1_prehashed(
            initial_witness,
            public_key_x,
            public_key_y,
            signature,
            message,
            *outputs,
        )
    }

    fn compute_merkle_root(
        &self,
        _initial_witness: &mut WitnessMap,
        _leaf: &FunctionInput,
        _index: &FunctionInput,
        _hash_path: &[FunctionInput],
        _output: &Witness,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        let leaf = witness_to_value(_initial_witness, _leaf.witness)?;

        let index = witness_to_value(_initial_witness, _index.witness)?;

        let hash_path: Result<Vec<_>, _> = _hash_path
            .iter()
            .map(|input| witness_to_value(_initial_witness, input.witness))
            .collect();

        let computed_merkle_root = merkle::compute_merkle_root(
            |left, right| self.blackbox_vendor.compress_native(left, right),
            hash_path?,
            index,
            leaf,
        )
        .map_err(|err| {
            OpcodeResolutionError::BlackBoxFunctionFailed(
                BlackBoxFunc::ComputeMerkleRoot,
                err.to_string(),
            )
        })?;

        _initial_witness.insert(*_output, computed_merkle_root);
        Ok(OpcodeResolution::Solved)
    }

    fn schnorr_verify(
        &self,
        _initial_witness: &mut WitnessMap,
        _public_key_x: &FunctionInput,
        _public_key_y: &FunctionInput,
        _signature: &[FunctionInput],
        _message: &[FunctionInput],
        _output: &Witness,
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        // In barretenberg, if the signature fails, then the whole thing fails.

        let pub_key_x = witness_to_value(_initial_witness, _public_key_x.witness)?.to_be_bytes();
        let pub_key_y = witness_to_value(_initial_witness, _public_key_y.witness)?.to_be_bytes();

        let pub_key_bytes: Vec<u8> = pub_key_x.iter().copied().chain(pub_key_y.to_vec()).collect();
        let pub_key: [u8; 64] = pub_key_bytes.try_into().map_err(|v: Vec<u8>| {
            OpcodeResolutionError::BlackBoxFunctionFailed(
                BlackBoxFunc::SchnorrVerify,
                format!("expected pubkey size {} but received {}", 64, v.len()),
            )
        })?;

        let mut signature = _signature.iter();
        let mut sig_s = [0u8; 32];
        for (i, sig) in sig_s.iter_mut().enumerate() {
            let _sig_i = signature.next().ok_or_else(|| {
                OpcodeResolutionError::BlackBoxFunctionFailed(
                    BlackBoxFunc::SchnorrVerify,
                    format!("sig_s should be 32 bytes long, found only {i} bytes"),
                )
            })?;
            let sig_i = witness_to_value(_initial_witness, _sig_i.witness)?;
            *sig = *sig_i.to_be_bytes().last().ok_or_else(|| {
                OpcodeResolutionError::BlackBoxFunctionFailed(
                    BlackBoxFunc::SchnorrVerify,
                    "could not get last bytes".into(),
                )
            })?;
        }
        let mut sig_e = [0u8; 32];
        for (i, sig) in sig_e.iter_mut().enumerate() {
            let _sig_i = signature.next().ok_or_else(|| {
                OpcodeResolutionError::BlackBoxFunctionFailed(
                    BlackBoxFunc::SchnorrVerify,
                    format!("sig_e should be 32 bytes long, found only {i} bytes"),
                )
            })?;
            let sig_i = witness_to_value(_initial_witness, _sig_i.witness)?;
            *sig = *sig_i.to_be_bytes().last().ok_or_else(|| {
                OpcodeResolutionError::BlackBoxFunctionFailed(
                    BlackBoxFunc::SchnorrVerify,
                    "could not get last bytes".into(),
                )
            })?;
        }

        let mut message_bytes = Vec::new();
        for msg in _message.iter() {
            let msg_i_field = witness_to_value(_initial_witness, msg.witness)?;
            let msg_i = *msg_i_field.to_be_bytes().last().ok_or_else(|| {
                OpcodeResolutionError::BlackBoxFunctionFailed(
                    BlackBoxFunc::SchnorrVerify,
                    "could not get last bytes".into(),
                )
            })?;
            message_bytes.push(msg_i);
        }

        let valid_signature = self
            .blackbox_vendor
            .verify_signature(pub_key, sig_s, sig_e, &message_bytes)
            .map_err(|err| {
                OpcodeResolutionError::BlackBoxFunctionFailed(
                    BlackBoxFunc::SchnorrVerify,
                    err.to_string(),
                )
            })?;
        if !valid_signature {
            dbg!("signature has failed to verify");
        }

        _initial_witness.insert(*_output, FieldElement::from(valid_signature));
        Ok(OpcodeResolution::Solved)
    }

    fn pedersen(
        &self,
        _initial_witness: &mut WitnessMap,
        _inputs: &[FunctionInput],
        _outputs: &[Witness],
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        // todo!("opcode does not have a rust implementation")

        let scalars: Result<Vec<_>, _> =
            _inputs.iter().map(|input| witness_to_value(_initial_witness, input.witness)).collect();
        let scalars: Vec<_> = scalars?.into_iter().cloned().collect();

        let (res_x, res_y) = self.blackbox_vendor.encrypt(scalars).map_err(|err| {
            OpcodeResolutionError::BlackBoxFunctionFailed(BlackBoxFunc::Pedersen, err.to_string())
        })?;
        _initial_witness.insert(_outputs[0], res_x);
        _initial_witness.insert(_outputs[1], res_y);
        Ok(OpcodeResolution::Solved)
    }

    fn fixed_base_scalar_mul(
        &self,
        _initial_witness: &mut WitnessMap,
        _input: &FunctionInput,
        _outputs: &[Witness],
    ) -> Result<OpcodeResolution, OpcodeResolutionError> {
        let scalar = witness_to_value(_initial_witness, _input.witness)?;

        let (pub_x, pub_y) = self.blackbox_vendor.fixed_base(scalar).map_err(|err| {
            OpcodeResolutionError::BlackBoxFunctionFailed(
                BlackBoxFunc::FixedBaseScalarMul,
                err.to_string(),
            )
        })?;

        _initial_witness.insert(_outputs[0], pub_x);
        _initial_witness.insert(_outputs[1], pub_y);
        Ok(OpcodeResolution::Solved)
    }
}

#[wasm_bindgen(typescript_custom_section)]
const ORACLE_CALLBACK: &'static str = r#"
/**
 * A callback which performs an oracle call and returns the response as an array of outputs.
 * @callback OracleCallback
 * @param {string} name - The identifier for the type of oracle call being performed.
 * @param {string[]} inputs - An array of hex encoded inputs to the oracle call.
 * @returns {Promise<string[]>} outputs - An array of hex encoded outputs containing the results of the oracle call.
 */
export type OracleCallback = (name: string, inputs: string[]) => Promise<string[]>;
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(extends = js_sys::Function, typescript_type = "OracleCallback")]
    pub type OracleCallback;
}

/// Executes an ACIR circuit to generate the solved witness from the initial witness.
///
/// @param {Uint8Array} circuit - A serialized representation of an ACIR circuit
/// @param {WitnessMap} initial_witness - The initial witness map defining all of the inputs to `circuit`..
/// @param {OracleCallback} oracle_callback - A callback to process oracle calls from the circuit.
/// @returns {WitnessMap} The solved witness calculated by executing the circuit on the provided inputs.
#[wasm_bindgen(js_name = executeCircuit, skip_jsdoc)]
pub async fn execute_circuit(
    circuit: Vec<u8>,
    initial_witness: JsWitnessMap,
    oracle_callback: OracleCallback,
) -> Result<JsWitnessMap, JsValue> {
    console_error_panic_hook::set_once();
    let circuit: Circuit = Circuit::read(&*circuit).expect("Failed to deserialize circuit");
    let mut witness_map = WitnessMap::from(initial_witness);

    let backend = SimulatedBackend::default();
    let mut blocks = Blocks::default();
    let mut opcodes = circuit.opcodes;

    loop {
        let solver_status = acvm::pwg::solve(&backend, &mut witness_map, &mut blocks, opcodes)
            .map_err(|err| err.to_string())?;

        match solver_status {
            PartialWitnessGeneratorStatus::Solved => break,
            PartialWitnessGeneratorStatus::RequiresOracleData {
                required_oracle_data,
                unsolved_opcodes,
            } => {
                // Perform all oracle queries
                let oracle_call_futures: Vec<_> = required_oracle_data
                    .into_iter()
                    .map(|oracle_call| resolve_oracle(&oracle_callback, oracle_call))
                    .collect();

                // Insert results into the witness map
                for oracle_call_future in oracle_call_futures {
                    let resolved_oracle_call: OracleData = oracle_call_future.await.unwrap();
                    for (i, witness_index) in resolved_oracle_call.outputs.iter().enumerate() {
                        insert_value(
                            witness_index,
                            resolved_oracle_call.output_values[i],
                            &mut witness_map,
                        )
                        .map_err(|err| err.to_string())?;
                    }
                }

                // Use new opcodes as returned by ACVM.
                opcodes = unsolved_opcodes;
            }
        }
    }

    Ok(witness_map.into())
}

fn insert_value(
    witness: &Witness,
    value_to_insert: FieldElement,
    initial_witness: &mut WitnessMap,
) -> Result<(), OpcodeResolutionError> {
    let optional_old_value = initial_witness.insert(*witness, value_to_insert);

    let old_value = match optional_old_value {
        Some(old_value) => old_value,
        None => return Ok(()),
    };

    if old_value != value_to_insert {
        return Err(OpcodeResolutionError::UnsatisfiedConstrain);
    }

    Ok(())
}

async fn resolve_oracle(
    oracle_callback: &OracleCallback,
    mut unresolved_oracle_call: OracleData,
) -> Result<OracleData, String> {
    // Prepare to call
    let name = JsValue::from(unresolved_oracle_call.name.clone());
    assert_eq!(unresolved_oracle_call.inputs.len(), unresolved_oracle_call.input_values.len());
    let inputs = js_sys::Array::default();
    for input_value in &unresolved_oracle_call.input_values {
        let hex_js_string = field_element_to_js_string(input_value);
        inputs.push(&hex_js_string);
    }

    // Call and await
    let this = JsValue::null();
    let ret_js_val = oracle_callback
        .call2(&this, &name, &inputs)
        .map_err(|err| format!("Error calling oracle_resolver: {}", format_js_err(err)))?;
    let ret_js_prom: js_sys::Promise = ret_js_val.into();
    let ret_future: wasm_bindgen_futures::JsFuture = ret_js_prom.into();
    let js_resolution = ret_future
        .await
        .map_err(|err| format!("Error awaiting oracle_resolver: {}", format_js_err(err)))?;

    // Check that result conforms to expected shape.
    if !js_resolution.is_array() {
        return Err("oracle_resolver must return a Promise<string[]>".into());
    }
    let js_arr = js_sys::Array::from(&js_resolution);
    let output_len = js_arr.length() as usize;
    let expected_output_len = unresolved_oracle_call.outputs.len();
    if output_len != expected_output_len {
        return Err(format!(
            "Expected output from oracle '{}' of {} elements, but instead received {}",
            unresolved_oracle_call.name, expected_output_len, output_len
        ));
    }

    // Insert result into oracle data.
    for elem in js_arr.iter() {
        if !elem.is_string() {
            return Err("Non-string element in oracle_resolver return".into());
        }
        unresolved_oracle_call.output_values.push(js_value_to_field_element(elem)?)
    }
    let resolved_oracle_call = unresolved_oracle_call;

    Ok(resolved_oracle_call)
}

fn format_js_err(err: JsValue) -> String {
    match err.as_string() {
        Some(str) => str,
        None => "Unknown".to_owned(),
    }
}
