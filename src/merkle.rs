// TODO(#166): Rework this module to return results
use acvm::FieldElement;

use crate::{pedersen::Pedersen, Barretenberg, Error};

// Hashes the leaves up the path, on the way to the root
pub(crate) trait PathHasher {
    fn new() -> Self;
    fn hash(&self, left: &FieldElement, right: &FieldElement) -> Result<FieldElement, Error>;
}

impl PathHasher for Barretenberg {
    fn hash(&self, left: &FieldElement, right: &FieldElement) -> Result<FieldElement, Error> {
        self.compress_native(left, right)
    }

    fn new() -> Self {
        Barretenberg::new()
    }
}

// Hashes the message into a leaf
pub(crate) trait MessageHasher {
    fn new() -> Self;
    fn hash(&mut self, msg: &[u8]) -> FieldElement;
}

impl MessageHasher for blake2::Blake2s256 {
    fn new() -> Self {
        use blake2::Digest;
        <blake2::Blake2s256 as Digest>::new()
    }

    fn hash(&mut self, msg: &[u8]) -> FieldElement {
        use blake2::Digest;

        self.update(msg);

        let res = self.clone().finalize();
        self.reset();
        FieldElement::from_be_bytes_reduce(&res[..])
    }
}
