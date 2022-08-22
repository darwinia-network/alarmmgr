use crate::error::CliResult;
use crate::types::StartCommand;

pub fn exec_start(command: StartCommand) -> CliResult<()> {
  println!("start");
  Ok(())
}
