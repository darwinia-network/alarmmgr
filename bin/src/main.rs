use alarmmgr_cli::types::Opt;
use structopt::StructOpt;

mod cli;
mod initialize;

#[tokio::main]
async fn main() -> color_eyre::Result<()> {
  initialize::init()?;

  let ret: Result<Opt, structopt::clap::Error> = Opt::from_args_safe();
  match ret {
    Ok(opt) => cli::execute(opt).await?,
    Err(e) => {
      e.exit();
    }
  }

  Ok(())
}
