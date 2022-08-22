use serde::{Deserialize, Serialize};
use structopt::StructOpt;

/// Start alarm manager
#[derive(Clone, Debug, Deserialize, Serialize, StructOpt)]
pub struct StartOpt {
  /// Enable api server
  #[structopt(long)]
  pub enable_api: bool,
}
