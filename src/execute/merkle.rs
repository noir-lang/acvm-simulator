use acvm::FieldElement;

use crate::Error;

pub(super) fn compute_merkle_root(
    hash_func: impl Fn(&FieldElement, &FieldElement) -> Result<FieldElement, Error>,
    hash_path: Vec<&FieldElement>,
    index: &FieldElement,
    leaf: &FieldElement,
) -> Result<FieldElement, Error> {
    let mut index_bits: Vec<bool> = index.bits();
    index_bits.reverse();

    assert!(hash_path.len() <= index_bits.len(), "hash path exceeds max depth of tree");
    index_bits.into_iter().zip(hash_path.into_iter()).fold(
        Ok(*leaf),
        |current_node, (path_bit, path_elem)| match current_node {
            Ok(current_node) => {
                let (left, right) =
                    if !path_bit { (&current_node, path_elem) } else { (path_elem, &current_node) };
                hash_func(left, right)
            }
            Err(_) => current_node,
        },
    )
}
