use dep::std;

fn main(x: Field) -> pub [Field; 2]  {
     let res = std::scalar_mul::fixed_base(x);
     std::println(res);
     res
}
