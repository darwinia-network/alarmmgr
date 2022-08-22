use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use structopt::StructOpt;

/// Start alarm manager
#[derive(Clone, Debug, Deserialize, Serialize, StructOpt)]
pub struct StartCommand {
  /// Enable api server
  #[structopt(long)]
  pub enable_api: bool,

  /// Config file path
  #[structopt(short = "c", long = "config", parse(from_os_str))]
  pub config_file: Option<PathBuf>,
}
