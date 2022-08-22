use structopt::StructOpt;

use crate::command::types::Opt;

mod cli;
mod command;
mod initialize;

fn main() -> color_eyre::Result<()> {
  initialize::init()?;

  let ret: Result<Opt, structopt::clap::Error> = Opt::from_args_safe();
  match ret {
    Ok(opt) => cli::execute(opt)?,
    Err(e) => {
      e.exit();
    }
  }

  Ok(())
}
