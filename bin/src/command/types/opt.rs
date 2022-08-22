use structopt::StructOpt;

use crate::command::types::StartOpt;

#[derive(Debug, StructOpt)]
#[structopt(name = "alarmmgr", about = "Alarm manager")]
pub enum Opt {
  /// Start monitor
  Start {
    /// Commands of start
    #[structopt(flatten)]
    command: StartOpt,
  },
}
