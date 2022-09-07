use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use structopt::StructOpt;

use alarmmgr_types::config::{Config, SlackNotificationInfo};
use alarmmgr_types::constants;

use crate::error::CliError;

/// Start alarm manager
#[derive(Clone, Debug, Deserialize, Serialize, StructOpt)]
pub struct StartCommand {
  /// Enable api server
  #[structopt(long)]
  pub enable_api: bool,

  /// Config base path
  #[structopt(short = "b", long, parse(from_os_str))]
  pub base_path: Option<PathBuf>,
}

impl StartCommand {}

impl TryFrom<StartCommand> for Config {
  type Error = CliError;

  fn try_from(command: StartCommand) -> Result<Self, Self::Error> {
    let base_path = command.base_path.unwrap_or_else(constants::app_home);
    Ok(Self {
      enable_api: command.enable_api,
      base_path,
      slack: Some(SlackNotificationInfo {
        channel: "darwinia-alert-notification".to_string(),
        icon_emoji: None,
      }),
    })
  }
}
