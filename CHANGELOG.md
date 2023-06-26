# Changelog

## 1.0.0 (2023-06-26)


### Features

* add circuit execution ([a089457](https://github.com/noir-lang/acvm-simulator/commit/a089457bc334cd8dc54c934b73b6a1cc41fe611e))
* Add functions to convert between compressed witnesses and `JSWitnessMap` ([#42](https://github.com/noir-lang/acvm-simulator/issues/42)) ([4a14ae4](https://github.com/noir-lang/acvm-simulator/commit/4a14ae475d27d85dd1f6ef6966a8aa9313f7f2bc))
* add mvp abi encode/decode ([98a4db5](https://github.com/noir-lang/acvm-simulator/commit/98a4db5a2ee5a68879fe02f0c4e3fdd5b7b602cd))
* add support for oracle opcodes ([f06d415](https://github.com/noir-lang/acvm-simulator/commit/f06d4151becb8de056da5295ab829d629b27be41))
* Add support for remaining black box opcodes using `barretenberg` ([#26](https://github.com/noir-lang/acvm-simulator/issues/26)) ([869cef9](https://github.com/noir-lang/acvm-simulator/commit/869cef91184dbd2a87b48ded6b9745b80e9bfcc3))
* added public_witness wasm utils ([#22](https://github.com/noir-lang/acvm-simulator/issues/22)) ([b0bd3ac](https://github.com/noir-lang/acvm-simulator/commit/b0bd3ac6d6f4ae0c2bb052d980c20f1ce4eb62ed))
* allow calling pedersen opcode with non-zero domain separator ([#58](https://github.com/noir-lang/acvm-simulator/issues/58)) ([9263984](https://github.com/noir-lang/acvm-simulator/commit/9263984cd1ab4e21ec1a43010890e09c446b91a0))
* Enforce `WitnessMap` type in TS ([#9](https://github.com/noir-lang/acvm-simulator/issues/9)) ([26b909f](https://github.com/noir-lang/acvm-simulator/commit/26b909f39d8678981bf9762a8319bbce117ddbb1))
* replace opaque witness maps with js Maps ([c84ffd4](https://github.com/noir-lang/acvm-simulator/commit/c84ffd49721f5da6eb48f15664f677196e4e237e))
* return errors rather than panicking ([69aed62](https://github.com/noir-lang/acvm-simulator/commit/69aed626d4b2e486e905b1903dd310bc6996dcd3))
* update to ACVM 0.11.0 ([b999ccc](https://github.com/noir-lang/acvm-simulator/commit/b999ccc61bff23275116f2ec557d54fdcced32a9))
* update to ACVM 0.12.0 ([#1](https://github.com/noir-lang/acvm-simulator/issues/1)) ([832d941](https://github.com/noir-lang/acvm-simulator/commit/832d941e62bb2591476334fc3e56034fdf20f49f))
* update to target ACVM 0.15.0 ([#48](https://github.com/noir-lang/acvm-simulator/issues/48)) ([1aaf057](https://github.com/noir-lang/acvm-simulator/commit/1aaf057b0cd23a793643d97b1c82b8dd53d33789))
* use JS naming convention for generated functions ([#6](https://github.com/noir-lang/acvm-simulator/issues/6)) ([482be49](https://github.com/noir-lang/acvm-simulator/commit/482be49121cabe3adb00c12da8e35da6519c4918))


### Bug Fixes

* **ci:** update working directory for wasm build step ([efd1bfc](https://github.com/noir-lang/acvm-simulator/commit/efd1bfc700404ce185ea3ceb613004dda43b8eed))
