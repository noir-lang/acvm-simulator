import { expect, test } from "@jest/globals";
import {
  abiEncode,
  abiDecode,
  executeCircuit,
  WitnessMap,
  OracleCallback,
} from "../../result/";

test("successfully executes circuit and extracts return value", async () => {
  // Noir program which enforces that x != y and returns x + y.
  const abi = {
    parameters: [
      { name: "x", type: { kind: "field" }, visibility: "private" },
      { name: "y", type: { kind: "field" }, visibility: "public" },
    ],
    param_witnesses: {
      x: [1],
      y: [2],
    },
    return_type: { kind: "field" },
    return_witnesses: [6],
  };
  const bytecode = Uint8Array.from([
    0, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 6, 0, 0, 0, 6,
    0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 48,
    100, 78, 114, 225, 49, 160, 41, 184, 80, 69, 182, 129, 129, 88, 93, 40, 51,
    232, 72, 121, 185, 112, 145, 67, 225, 245, 147, 240, 0, 0, 0, 2, 0, 0, 0,
    48, 100, 78, 114, 225, 49, 160, 41, 184, 80, 69, 182, 129, 129, 88, 93, 40,
    51, 232, 72, 121, 185, 112, 145, 67, 225, 245, 147, 240, 0, 0, 0, 3, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0, 1, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0, 0, 0, 4, 0, 0, 0, 48, 100, 78, 114, 225,
    49, 160, 41, 184, 80, 69, 182, 129, 129, 88, 93, 40, 51, 232, 72, 121, 185,
    112, 145, 67, 225, 245, 147, 240, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 0, 0, 0, 5, 0, 0, 0, 48,
    100, 78, 114, 225, 49, 160, 41, 184, 80, 69, 182, 129, 129, 88, 93, 40, 51,
    232, 72, 121, 185, 112, 145, 67, 225, 245, 147, 240, 0, 0, 0, 3, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 48, 100, 78, 114, 225, 49, 160,
    41, 184, 80, 69, 182, 129, 129, 88, 93, 40, 51, 232, 72, 121, 185, 112, 145,
    67, 225, 245, 147, 240, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2,
    0, 0, 0, 48, 100, 78, 114, 225, 49, 160, 41, 184, 80, 69, 182, 129, 129, 88,
    93, 40, 51, 232, 72, 121, 185, 112, 145, 67, 225, 245, 147, 240, 0, 0, 0, 6,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const inputs = {
    x: "1",
    y: "2",
  };
  const return_witness: number = abi.return_witnesses[0];

  const initial_witness: WitnessMap = abiEncode(abi, inputs, null);
  const solved_witness: WitnessMap = await executeCircuit(
    bytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  // Solved witness should be consistent with initial witness
  initial_witness.forEach((value, key) => {
    expect(solved_witness.get(key) as string).toBe(value);
  });
  // Solved witness should contain expected return value
  expect(BigInt(solved_witness.get(return_witness) as string)).toBe(3n);

  const decoded_inputs = abiDecode(abi, solved_witness);

  expect(BigInt(decoded_inputs.return_value)).toBe(3n);
});

test("successfully processes oracle opcodes", async () => {
  // We use a handwritten circuit which uses an oracle to calculate the sum of witnesses 1 and 2
  // and stores the result in witness 3. This is then enforced by an arithmetic opcode to check the result is correct.

  // let oracle = OracleData {
  //     name: "example_oracle".to_owned(),
  //     inputs: vec![Witness(1).into(), Witness(2).into()],
  //     input_values: Vec::new(),
  //     outputs: vec![Witness(3)],
  //     output_values: Vec::new(),
  // };
  // let check: Expression = Expression {
  //     mul_terms: Vec::new(),
  //     linear_combinations: vec![
  //         (FieldElement::one(), Witness(1)),
  //         (FieldElement::one(), Witness(2)),
  //         (-FieldElement::one(), Witness(3)),
  //     ],
  //     q_c: FieldElement::zero(),
  // };

  // let circuit = Circuit {
  //     current_witness_index: 4,
  //     opcodes: vec![Opcode::Oracle(oracle), Opcode::Arithmetic(check)],
  //     public_parameters: PublicInputs::default(),
  //     return_values: PublicInputs::default(),
  // };
  const oracle_bytecode = new Uint8Array([
    0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 6, 14, 0, 0, 0,
    101, 120, 97, 109, 112, 108, 101, 95, 111, 114, 97, 99, 108, 101, 2, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0,
    48, 100, 78, 114, 225, 49, 160, 41, 184, 80, 69, 182, 129, 129, 88, 93, 40,
    51, 232, 72, 121, 185, 112, 145, 67, 225, 245, 147, 240, 0, 0, 0, 3, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  const initial_witness: WitnessMap = new Map();
  initial_witness.set(
    1,
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
  initial_witness.set(
    2,
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );

  let observedName = "";
  let observedInputs: string[] = [];
  const oracleCallback: OracleCallback = async (
    name: string,
    inputs: string[]
  ) => {
    // Throwing inside the oracle callback causes a timeout so we log the observed values
    // and defer the check against expected values until after the execution is complete.
    observedName = name;
    observedInputs = inputs;

    // Witness(1) + Witness(2) = 1 + 1 = 2
    return ["0x02"];
  };
  const solved_witness: WitnessMap = await executeCircuit(
    oracle_bytecode,
    initial_witness,
    oracleCallback
  );

  // Check that expected values were passed to oracle callback.
  expect(observedName).toBe("example_oracle");
  expect(observedInputs).toStrictEqual([
    initial_witness.get(1) as string,
    initial_witness.get(2) as string,
  ]);

  // If incorrect value is written into circuit then execution should halt due to unsatisfied constraint in
  // arithmetic opcode. Nevertheless, check that returned value was inserted correctly.
  expect(solved_witness.get(3) as string).toBe(
    "0x0000000000000000000000000000000000000000000000000000000000000002"
  );
});

test("successfully executes a pedersen hash", async () => {
  // let pedersen = Opcode::BlackBoxFuncCall(BlackBoxFuncCall {
  //     name: crate::BlackBoxFunc::Pedersen,
  //     inputs: vec![FunctionInput {
  //         witness: Witness(1),
  //         num_bits: FieldElement::max_num_bits(),
  //     }],
  //     outputs: vec![Witness(2), Witness(3)],
  // });

  // let circuit = Circuit {
  //     current_witness_index: 4,
  //     opcodes: vec![pedersen],
  //     public_parameters: PublicInputs::default(),
  //     return_values: PublicInputs(BTreeSet::from_iter(vec![Witness(2), Witness(3)])),
  // };
  const abi = {
    parameters: [{ name: "x", type: { kind: "field" }, visibility: "private" }],
    param_witnesses: {
      x: [1],
    },
    return_type: { kind: "array", type: { kind: "field" }, length: 2 },
    return_witnesses: [2, 3],
  };
  const bytecode = Uint8Array.from([
    0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1,
    0, 0, 0, 1, 5, 0, 1, 0, 0, 0, 1, 0, 0, 0, 254, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0,
    0, 3, 0, 0, 0,
  ]);

  const inputs = {
    x: "1",
  };

  const initial_witness: WitnessMap = abiEncode(abi, inputs, null);
  const solved_witness: WitnessMap = await executeCircuit(
    bytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  const decoded_inputs = abiDecode(abi, solved_witness);

  const expectedResult = ["0x09489945604c9686e698cb69d7bd6fc0cdb02e9faae3e1a433f1c342c1a5ecc4", "0x24f50d25508b4dfb1e8a834e39565f646e217b24cb3a475c2e4991d1bb07a9d8"];

  expect(decoded_inputs.return_value).toEqual(expectedResult);
});

test("successfully executes a FixedBaseScalarMul opcode", async () => {
  // let fixed_base_scalar_mul = Opcode::BlackBoxFuncCall(BlackBoxFuncCall {
  //     name: crate::BlackBoxFunc::FixedBaseScalarMul,
  //     inputs: vec![FunctionInput {
  //         witness: Witness(1),
  //         num_bits: FieldElement::max_num_bits(),
  //     }],
  //     outputs: vec![Witness(2), Witness(3)],
  // });

  // let circuit = Circuit {
  //     current_witness_index: 4,
  //     opcodes: vec![fixed_base_scalar_mul],
  //     public_parameters: PublicInputs::default(),
  //     return_values: PublicInputs(BTreeSet::from_iter(vec![Witness(2), Witness(3)])),
  // };
  const abi = {
    parameters: [{ name: "x", type: { kind: "field" }, visibility: "private" }],
    param_witnesses: {
      x: [1],
    },
    return_type: { kind: "array", type: { kind: "field" }, length: 2 },
    return_witnesses: [2, 3],
  };
  const bytecode = Uint8Array.from([
    0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1,
    0, 0, 0, 1, 8, 0, 1, 0, 0, 0, 1, 0, 0, 0, 254, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0,
    0, 3, 0, 0, 0,
  ]);

  const inputs = {
    x: "1",
  };

  const initial_witness: WitnessMap = abiEncode(abi, inputs, null);
  const solved_witness: WitnessMap = await executeCircuit(
    bytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  const decoded_inputs = abiDecode(abi, solved_witness);

  const expectedResult =     [
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    '0x0000000000000002cf135e7506a45d632d270d45f1181294833fc48d823f272c'
  ];

  console.log(decoded_inputs.return_value);

  expect(decoded_inputs.return_value).toEqual(expectedResult);
});

test("successfully executes a SchnorrVerify opcode", async () => {
  // let pub_x = FunctionInput { witness: Witness(1), num_bits: FieldElement::max_num_bits() };
  // let pub_y = FunctionInput { witness: Witness(2), num_bits: FieldElement::max_num_bits() };
  // let signature_inputs =
  //     (3..(3 + 64)).map(|i| FunctionInput { witness: Witness(i), num_bits: 8 });
  // let message_inputs =
  //     ((3 + 64)..(3 + 64 + 10)).map(|i| FunctionInput { witness: Witness(i), num_bits: 8 });

  // let schnorr = Opcode::BlackBoxFuncCall(BlackBoxFuncCall {
  //     name: crate::BlackBoxFunc::SchnorrVerify,
  //     inputs: vec![pub_x, pub_y]
  //         .into_iter()
  //         .chain(signature_inputs)
  //         .chain(message_inputs)
  //         .collect(),
  //     outputs: vec![Witness(3 + 64 + 10)],
  // });

  // let circuit = Circuit {
  //     current_witness_index: 100,
  //     opcodes: vec![schnorr],
  //     public_parameters: PublicInputs::default(),
  //     return_values: PublicInputs(BTreeSet::from_iter(vec![Witness(3 + 10 + 64)])),
  // };
  const abi = {
    parameters: [
      { name: "x", type: { kind: "field" }, visibility: "private" },
      { name: "y", type: { kind: "field" }, visibility: "private" },
      {
        name: "sig",
        type: {
          kind: "array",
          type: { kind: "integer", width: 8, sign: "unsigned" },
          length: 64,
        },
        visibility: "private",
      },
      {
        name: "msg",
        type: {
          kind: "array",
          type: { kind: "integer", width: 8, sign: "unsigned" },
          length: 10,
        },
        visibility: "private",
      },
    ],
    param_witnesses: {
      x: [1],
      y: [2],
      sig: Array.from({ length: 64 }, (_, i) => 3 + i),
      msg: Array.from({ length: 10 }, (_, i) => 3 + 64 + i),
    },
    return_type: { kind: "boolean" },
    return_witnesses: [3 + 10 + 64],
  };
  const bytecode = Uint8Array.from([
    0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 77, 0, 0, 0, 1, 0, 0, 0,
    1, 3, 0, 76, 0, 0, 0, 1, 0, 0, 0, 254, 0, 0, 0, 2, 0, 0, 0, 254, 0, 0, 0, 3,
    0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 5, 0, 0, 0, 8, 0, 0, 0, 6, 0,
    0, 0, 8, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0,
    0, 8, 0, 0, 0, 10, 0, 0, 0, 8, 0, 0, 0, 11, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0,
    0, 8, 0, 0, 0, 13, 0, 0, 0, 8, 0, 0, 0, 14, 0, 0, 0, 8, 0, 0, 0, 15, 0, 0,
    0, 8, 0, 0, 0, 16, 0, 0, 0, 8, 0, 0, 0, 17, 0, 0, 0, 8, 0, 0, 0, 18, 0, 0,
    0, 8, 0, 0, 0, 19, 0, 0, 0, 8, 0, 0, 0, 20, 0, 0, 0, 8, 0, 0, 0, 21, 0, 0,
    0, 8, 0, 0, 0, 22, 0, 0, 0, 8, 0, 0, 0, 23, 0, 0, 0, 8, 0, 0, 0, 24, 0, 0,
    0, 8, 0, 0, 0, 25, 0, 0, 0, 8, 0, 0, 0, 26, 0, 0, 0, 8, 0, 0, 0, 27, 0, 0,
    0, 8, 0, 0, 0, 28, 0, 0, 0, 8, 0, 0, 0, 29, 0, 0, 0, 8, 0, 0, 0, 30, 0, 0,
    0, 8, 0, 0, 0, 31, 0, 0, 0, 8, 0, 0, 0, 32, 0, 0, 0, 8, 0, 0, 0, 33, 0, 0,
    0, 8, 0, 0, 0, 34, 0, 0, 0, 8, 0, 0, 0, 35, 0, 0, 0, 8, 0, 0, 0, 36, 0, 0,
    0, 8, 0, 0, 0, 37, 0, 0, 0, 8, 0, 0, 0, 38, 0, 0, 0, 8, 0, 0, 0, 39, 0, 0,
    0, 8, 0, 0, 0, 40, 0, 0, 0, 8, 0, 0, 0, 41, 0, 0, 0, 8, 0, 0, 0, 42, 0, 0,
    0, 8, 0, 0, 0, 43, 0, 0, 0, 8, 0, 0, 0, 44, 0, 0, 0, 8, 0, 0, 0, 45, 0, 0,
    0, 8, 0, 0, 0, 46, 0, 0, 0, 8, 0, 0, 0, 47, 0, 0, 0, 8, 0, 0, 0, 48, 0, 0,
    0, 8, 0, 0, 0, 49, 0, 0, 0, 8, 0, 0, 0, 50, 0, 0, 0, 8, 0, 0, 0, 51, 0, 0,
    0, 8, 0, 0, 0, 52, 0, 0, 0, 8, 0, 0, 0, 53, 0, 0, 0, 8, 0, 0, 0, 54, 0, 0,
    0, 8, 0, 0, 0, 55, 0, 0, 0, 8, 0, 0, 0, 56, 0, 0, 0, 8, 0, 0, 0, 57, 0, 0,
    0, 8, 0, 0, 0, 58, 0, 0, 0, 8, 0, 0, 0, 59, 0, 0, 0, 8, 0, 0, 0, 60, 0, 0,
    0, 8, 0, 0, 0, 61, 0, 0, 0, 8, 0, 0, 0, 62, 0, 0, 0, 8, 0, 0, 0, 63, 0, 0,
    0, 8, 0, 0, 0, 64, 0, 0, 0, 8, 0, 0, 0, 65, 0, 0, 0, 8, 0, 0, 0, 66, 0, 0,
    0, 8, 0, 0, 0, 67, 0, 0, 0, 8, 0, 0, 0, 68, 0, 0, 0, 8, 0, 0, 0, 69, 0, 0,
    0, 8, 0, 0, 0, 70, 0, 0, 0, 8, 0, 0, 0, 71, 0, 0, 0, 8, 0, 0, 0, 72, 0, 0,
    0, 8, 0, 0, 0, 73, 0, 0, 0, 8, 0, 0, 0, 74, 0, 0, 0, 8, 0, 0, 0, 75, 0, 0,
    0, 8, 0, 0, 0, 76, 0, 0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 77, 0, 0, 0,
  ]);

  const inputs = {
    x: "0x17cbd3ed3151ccfd170efe1d54280a6a4822640bf5c369908ad74ea21518a9c5",
    y: "0x0e0456e3795c1a31f20035b741cd6158929eeccd320d299cfcac962865a6bc74",
    sig: [
      5, 202, 31, 146, 81, 242, 246, 69, 43, 107, 249, 153, 198, 44, 14, 111,
      191, 121, 137, 166, 160, 103, 18, 181, 243, 233, 226, 95, 67, 16, 37, 128,
      85, 76, 19, 253, 30, 77, 192, 53, 138, 205, 69, 33, 236, 163, 83, 194, 84,
      137, 184, 221, 176, 121, 179, 27, 63, 70, 54, 16, 176, 250, 39, 239,
    ],
    msg: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  };

  const initial_witness: WitnessMap = abiEncode(abi, inputs, null);
  const solved_witness: WitnessMap = await executeCircuit(
    bytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  const decoded_inputs = abiDecode(abi, solved_witness);
  console.log(decoded_inputs);
  expect(BigInt(decoded_inputs.return_value).toString()).toBe(1n.toString());
});
