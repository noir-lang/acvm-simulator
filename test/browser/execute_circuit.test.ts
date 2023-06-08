import { expect } from "@esm-bundle/chai";
import initACVMSimulator, {
  abiEncode,
  abiDecode,
  executeCircuit,
  WitnessMap,
  OracleCallback,
} from "../../result/";

import {
  abi as noirAbi,
  bytecode as noirBytecode,
  inputs as noirInputs,
  expectedResult as noirResult,
} from "../shared/noir_program";
import {
  bytecode as oracleBytecode,
  initialWitnessMap as oracleInitialWitnessMap,
  expectedWitnessMap as oracleExpectedWitnessMap,
  oracleResponse,
  oracleCallName,
} from "../shared/oracle";
import {
  abi as pedersenAbi,
  bytecode as pedersenBytecode,
  inputs as pedersenInputs,
  expectedResult as pedersenResult,
} from "../shared/pedersen";
import {
  abi as fixedBaseScalarMulAbi,
  bytecode as fixedBaseScalarMulBytecode,
  inputs as fixedBaseScalarMulInputs,
  expectedResult as fixedBaseScalarMulResult,
} from "../shared/fixed_base_scalar_mul";
import {
  abi as schnorrVerifyAbi,
  bytecode as schnorrVerifyBytecode,
  inputs as schnorrVerifyInputs,
  expectedResult as schnorrVerifyResult,
} from "../shared/schnorr_verify";

it("successfully executes circuit and extracts return value", async () => {
  await initACVMSimulator();

  const return_witness: number = noirAbi.return_witnesses[0];

  const initial_witness: WitnessMap = abiEncode(noirAbi, noirInputs, null);
  const solved_witness: WitnessMap = await executeCircuit(
    noirBytecode,
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
  expect(BigInt(solved_witness.get(return_witness) as string)).to.equal(
    noirResult
  );

  const decoded_inputs = abiDecode(noirAbi, solved_witness);

  expect(BigInt(decoded_inputs.return_value)).to.equal(noirResult);
});

it("successfully processes oracle opcodes", async () => {
  await initACVMSimulator();

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
    return [oracleResponse];
  };
  const solved_witness: WitnessMap = await executeCircuit(
    oracleBytecode,
    oracleInitialWitnessMap,
    oracleCallback
  );

  // Check that expected values were passed to oracle callback.
  expect(observedName).to.be.equal(oracleCallName);
  expect(observedInputs).to.be.deep.eq([
    oracleInitialWitnessMap.get(1) as string,
    oracleInitialWitnessMap.get(2) as string,
  ]);

  // If incorrect value is written into circuit then execution should halt due to unsatisfied constraint in
  // arithmetic opcode. Nevertheless, check that returned value was inserted correctly.
  expect(solved_witness).to.be.deep.eq(oracleExpectedWitnessMap);
});

it("successfully executes a pedersen hash", async () => {
  await initACVMSimulator();

  const initial_witness: WitnessMap = abiEncode(
    pedersenAbi,
    pedersenInputs,
    null
  );
  const solved_witness: WitnessMap = await executeCircuit(
    pedersenBytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  const decoded_inputs = abiDecode(pedersenAbi, solved_witness);

  expect(decoded_inputs.return_value).to.be.deep.eq(pedersenResult);
});

it("successfully executes a FixedBaseScalarMul opcode", async () => {
  await initACVMSimulator();

  const initial_witness: WitnessMap = abiEncode(
    fixedBaseScalarMulAbi,
    fixedBaseScalarMulInputs,
    null
  );
  const solved_witness: WitnessMap = await executeCircuit(
    fixedBaseScalarMulBytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  const decoded_inputs = abiDecode(fixedBaseScalarMulAbi, solved_witness);

  expect(decoded_inputs.return_value).to.be.deep.eq(fixedBaseScalarMulResult);
});

it("successfully executes a SchnorrVerify opcode", async () => {
  await initACVMSimulator();

  const initial_witness: WitnessMap = abiEncode(
    schnorrVerifyAbi,
    schnorrVerifyInputs,
    null
  );
  const solved_witness: WitnessMap = await executeCircuit(
    schnorrVerifyBytecode,
    initial_witness,
    () => {
      throw Error("unexpected oracle");
    }
  );

  const decoded_inputs = abiDecode(schnorrVerifyAbi, solved_witness);
  expect(BigInt(decoded_inputs.return_value)).to.be.eq(schnorrVerifyResult);
});
