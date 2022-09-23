use serde::{Deserialize, Serialize};

/// Notify input message
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NotifyMessage {
  /// message title
  pub title: String,
  /// message body
  pub body: String,
  /// Alert level
  pub level: Option<AlertLevel>,
  /// slack message detail
  pub slack: Option<SlackMessageDetail>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum AlertLevel {
  P1,
  P2,
  P3,
}

impl AlertLevel {
  pub fn view(&self) -> &'static str {
    match self {
      Self::P1 => "P1",
      Self::P2 => "P2",
      Self::P3 => "P3",
    }
  }
}

impl NotifyMessage {
  pub fn create(title: impl AsRef<str>, body: impl AsRef<str>) -> Self {
    Self {
      title: title.as_ref().to_string(),
      body: body.as_ref().to_string(),
      level: None,
      slack: None,
    }
  }

  pub fn slack(title: impl AsRef<str>, body: impl AsRef<str>, slack: SlackMessageDetail) -> Self {
    Self {
      title: title.as_ref().to_string(),
      body: body.as_ref().to_string(),
      level: None,
      slack: Some(slack),
    }
  }

  pub fn slack_default(title: impl AsRef<str>, body: impl AsRef<str>) -> Self {
    Self::slack(title, body, Default::default())
  }
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
