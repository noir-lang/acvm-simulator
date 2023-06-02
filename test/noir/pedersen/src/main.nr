use dep::std;

fn main(x: Field) -> pub [Field; 2] {
    let hash = std::hash::pedersen([x]);
    std::println(hash);
    hash
}
    
