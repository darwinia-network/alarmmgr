mod cli;
mod command;
mod initialize;

fn main() -> color_eyre::Result<()> {
  initialize::init()?;
  println!("hello");
  Ok(())
}
