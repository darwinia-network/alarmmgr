use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// alarmmgr config
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Config {
  /// enable api
  pub enable_api: bool,
  /// config base path
  pub base_path: PathBuf,

  /// slack message details
  pub slack: Option<SlackNotificationInfo>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SlackNotificationInfo {
  pub channel: String,
  pub icon_emoji: Option<String>,
}
