use crate::command::types::StartOpt;

pub fn exec_start(command: StartOpt) -> color_eyre::Result<()> {
  println!("start");
  Ok(())
}
