import { expect } from "@esm-bundle/chai";
import initACVMSimulator, {
  abiEncode,
  abiDecode,
  executeCircuit,
  WitnessMap,
  OracleCallback,
  init_log_level,
} from "../../result/";

beforeEach(async () => {
  await initACVMSimulator();

  init_log_level("INFO");
});

it("successfully executes circuit and extracts return value", async () => {
  // fn main(x : Field, y : pub Field) -> pub Field {
  //   assert(x != y);
  //   x + y
  // }
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
    205, 147, 189, 13, 194, 48, 16, 133, 69, 254, 88, 199, 23, 219, 201, 185, 3,
    137, 134, 49, 72, 184, 8, 23, 80, 88, 86, 122, 111, 128, 99, 196, 8, 72,
    176, 17, 219, 64, 65, 147, 218, 70, 202, 13, 240, 73, 223, 123, 247, 110,
    235, 187, 123, 109, 141, 182, 167, 51, 89, 221, 135, 107, 152, 222, 27, 22,
    119, 176, 250, 50, 56, 107, 132, 160, 182, 38, 224, 112, 96, 181, 234, 80,
    50, 33, 187, 6, 1, 65, 162, 60, 214, 200, 57, 161, 192, 86, 117, 170, 101,
    10, 4, 39, 24, 164, 226, 195, 15, 146, 37, 96, 228, 209, 42, 204, 61, 119,
    218, 80, 111, 245, 72, 238, 177, 191, 140, 100, 236, 148, 23, 179, 200, 124,
    136, 79, 44, 47, 124, 2, 223, 50, 129, 111, 114, 179, 210, 47, 164, 201,
    217, 155, 47, 35, 110, 248, 207, 246, 98, 25, 41, 182, 87, 197, 55, 230, 51,
    95, 125, 0,
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
    expect(solved_witness.get(key) as string).to.equal(value);
  });
  // Solved witness should contain expected return value
  expect(BigInt(solved_witness.get(return_witness) as string)).to.equal(3n);

  const decoded_inputs = abiDecode(abi, solved_witness);

  expect(BigInt(decoded_inputs.return_value)).to.equal(3n);
});

it("successfully processes oracle opcodes", async () => {
  // await initACVMSimulator();

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
    173, 144, 177, 13, 194, 48, 16, 69, 5, 97, 32, 159, 207, 142, 207, 29, 76,
    192, 8, 200, 14, 23, 17, 41, 17, 40, 74, 65, 155, 13, 28, 27, 86, 160, 160,
    96, 31, 182, 1, 33, 54, 176, 127, 247, 155, 167, 255, 223, 109, 19, 231,
    199, 126, 116, 77, 207, 247, 23, 95, 221, 112, 233, 249, 112, 254, 245, 152,
    194, 18, 223, 91, 145, 23, 88, 101, 35, 68, 153, 33, 235, 252, 33, 97, 169,
    194, 252, 220, 141, 221, 116, 26, 120, 234, 154, 20, 82, 9, 67, 37, 206,
    125, 25, 40, 106, 165, 216, 72, 6, 4, 39, 164, 245, 164, 133, 210, 190, 38,
    32, 208, 164, 143, 146, 16, 153, 20, 25, 235, 173, 17, 22, 20, 50, 180, 218,
    98, 251, 135, 84, 5, 4, 133, 15,
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
  expect(observedName).to.be.equal("example_oracle");
  expect(observedInputs).to.have.same.members([
    initial_witness.get(1) as string,
    initial_witness.get(2) as string,
  ]);

  // If incorrect value is written into circuit then execution should halt due to unsatisfied constraint in
  // arithmetic opcode. Nevertheless, check that returned value was inserted correctly.
  expect(solved_witness.get(3) as string).to.be.equal(
    "0x0000000000000000000000000000000000000000000000000000000000000002"
  );
});

it("successfully executes a pedersen hash", async () => {
  const abi = {
    parameters: [{ name: "x", type: { kind: "field" }, visibility: "private" }],
    param_witnesses: {
      x: [1],
    },
    return_type: { kind: "array", type: { kind: "field" }, length: 2 },
    return_witnesses: [2, 3],
  };
  const bytecode = Uint8Array.from([
    1, 45, 0, 210, 255, 148, 4, 145, 129, 176, 66, 108, 97, 99, 107, 66, 111,
    120, 70, 117, 110, 99, 67, 97, 108, 108, 129, 168, 80, 101, 100, 101, 114,
    115, 101, 110, 147, 145, 146, 1, 204, 254, 0, 146, 2, 3, 144, 146, 2, 3,
  ]);

  const inputs = {
    x: "1",
  };

  const initial_witness: WitnessMap = abiEncode(abi, inputs, null);

  const solved_witness: WitnessMap = await executeCircuit(
    bytecode,
    initial_witness,
    () => {
      throw Error("unexpected opcode");
    }
  );

  const decoded_inputs = abiDecode(abi, solved_witness);

  const expectedResult = [
    "0x09489945604c9686e698cb69d7bd6fc0cdb02e9faae3e1a433f1c342c1a5ecc4",
    "0x24f50d25508b4dfb1e8a834e39565f646e217b24cb3a475c2e4991d1bb07a9d8",
  ];

  return expect(decoded_inputs.return_value).to.have.same.members(
    expectedResult
  );
});

it("successfully executes a FixedBaseScalarMul opcode", async () => {
  const abi = {
    parameters: [{ name: "x", type: { kind: "field" }, visibility: "private" }],
    param_witnesses: {
      x: [1],
    },
    return_type: { kind: "array", type: { kind: "field" }, length: 2 },
    return_witnesses: [2, 3],
  };
  const bytecode = Uint8Array.from([
    1, 53, 0, 202, 255, 148, 4, 145, 129, 176, 66, 108, 97, 99, 107, 66, 111,
    120, 70, 117, 110, 99, 67, 97, 108, 108, 129, 178, 70, 105, 120, 101, 100,
    66, 97, 115, 101, 83, 99, 97, 108, 97, 114, 77, 117, 108, 146, 146, 1, 204,
    254, 146, 2, 3, 144, 146, 2, 3,
  ]);

  const inputs = {
    x: "1",
  };

  const initial_witness: WitnessMap = abiEncode(abi, inputs, null);
  const solved_witness: WitnessMap = await executeCircuit(
    bytecode,
    initial_witness,
    () => {
      throw Error("unexpected opcode");
    }
  );

  const decoded_inputs = abiDecode(abi, solved_witness);

  const expectedResult = [
    "0x0000000000000000000000000000000000000000000000000000000000000001",
    "0x0000000000000002cf135e7506a45d632d270d45f1181294833fc48d823f272c",
  ];

  expect(decoded_inputs.return_value).to.have.same.members(expectedResult);
});

it("successfully executes a SchnorrVerify opcode", async () => {
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
    5, 128, 71, 74, 3, 1, 0, 0, 237, 142, 189, 247, 222, 123, 239, 61, 38, 26,
    107, 78, 130, 247, 176, 42, 138, 75, 2, 11, 130, 30, 243, 3, 51, 232, 197,
    63, 8, 62, 36, 79, 240, 45, 33, 124, 61, 228, 115, 127, 241, 48, 29, 188,
    198, 179, 239, 201, 183, 76, 144, 72, 135, 97, 238, 247, 46, 120, 206, 100,
    163, 232, 254, 49, 122, 121, 250, 248, 182, 188, 80, 180, 162, 80, 252, 47,
    139, 89, 137, 85, 88, 141, 53, 88, 139, 96, 29, 214, 99, 3, 54, 98, 19, 54,
    99, 11, 182, 98, 27, 182, 99, 7, 118, 98, 23, 118, 99, 15, 246, 98, 31, 246,
    227, 0, 14, 226, 16, 14, 227, 8, 142, 226, 24, 142, 227, 4, 78, 226, 20, 78,
    227, 12, 206, 226, 28, 206, 227, 2, 46, 226, 18, 46, 227, 10, 174, 226, 26,
    174, 227, 6, 110, 226, 22, 110, 227, 14, 238, 226, 30, 238, 227, 1, 30, 226,
    17, 30, 227, 9, 198, 240, 20, 227, 252, 152, 192, 51, 60, 199, 36, 94, 224,
    37, 94, 225, 53, 222, 224, 45, 169, 207, 124, 170, 4,
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
      throw Error("unexpected opcode");
    }
  );

  const decoded_inputs = abiDecode(abi, solved_witness);
  expect(BigInt(decoded_inputs.return_value).toString()).to.be.equal(
    1n.toString()
  );
});
