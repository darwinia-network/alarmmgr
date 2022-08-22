use alarmmgr_cli::handler;

use crate::Opt;

pub fn execute(opt: Opt) -> color_eyre::Result<()> {
  if let Err(e) = run(opt) {
    // maybe there have some special error to handle.
    return Err(e);
  }
  Ok(())
}

fn run(opt: Opt) -> color_eyre::Result<()> {
  match opt {
    Opt::Start { command } => Ok(handler::exec_start(command)?),
  }
}
