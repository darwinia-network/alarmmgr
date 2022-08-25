use serde::{Deserialize, Serialize};

/// Notify input message
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NotifyMessage {
  /// message title
  pub title: String,
  /// message body
  pub body: String,
  /// slack message detail
  pub slack: Option<SlackMessageDetail>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SlackMessageDetail {
  pub channel: String,
  pub icon_emoji: Option<String>,
}

impl Default for SlackMessageDetail {
  fn default() -> Self {
    Self {
      channel: "notification".to_string(),
      icon_emoji: None,
    }
  }
}
