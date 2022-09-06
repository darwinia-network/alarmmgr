use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use alarmmgr_notification::types::{AlertLevel, NotifyMessage};

use crate::traits::ProbeReporter;
use crate::types::ProbeMark;

/// probe data
#[derive(Clone, Debug, Deserialize, Serialize, strum::EnumString)]
#[strum(serialize_all = "kebab_case")]
#[serde(rename_all = "kebab-case")]
pub enum AlertInfo {
  Normal {
    id: String,
    mark: ProbeMark,
  },
  P1 {
    id: String,
    mark: ProbeMark,
    message: AlertMessage,
  },
  P2 {
    id: String,
    mark: ProbeMark,
    message: AlertMessage,
  },
  P3 {
    id: String,
    mark: ProbeMark,
    message: AlertMessage,
  },
}

impl ProbeReporter for AlertInfo {
  fn id(&self) -> String {
    match self {
      AlertInfo::Normal { id, .. } => id.clone(),
      AlertInfo::P1 { id, .. } => id.clone(),
      AlertInfo::P2 { id, .. } => id.clone(),
      AlertInfo::P3 { id, .. } => id.clone(),
    }
  }

  fn mark(&self) -> String {
    match self {
      AlertInfo::Normal { mark, .. } => mark.raw(),
      AlertInfo::P1 { mark, .. } => mark.raw(),
      AlertInfo::P2 { mark, .. } => mark.raw(),
      AlertInfo::P3 { mark, .. } => mark.raw(),
    }
  }
}

impl AlertInfo {
  pub fn message(&self) -> Option<AlertMessage> {
    match self {
      AlertInfo::Normal { .. } => None,
      AlertInfo::P1 { message, .. } => Some(message.clone()),
      AlertInfo::P2 { message, .. } => Some(message.clone()),
      AlertInfo::P3 { message, .. } => Some(message.clone()),
    }
  }

  pub fn to_alert_level(&self) -> Option<AlertLevel> {
    match self {
      AlertInfo::Normal { .. } => None,
      AlertInfo::P1 { .. } => Some(AlertLevel::P1),
      AlertInfo::P2 { .. } => Some(AlertLevel::P2),
      AlertInfo::P3 { .. } => Some(AlertLevel::P3),
    }
  }

  pub fn to_notify_message(&self) -> Option<NotifyMessage> {
    let mark = self.mark();
    let level = self.to_alert_level();
    self.message().map(|message| NotifyMessage {
      title: message.title,
      body: format!("[{}] {}", mark, message.body.unwrap_or_default()),
      level,
      slack: Default::default(),
    })
  }
}

/// alert message
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AlertMessage {
  pub title: String,
  pub body: Option<String>,
  pub origin: MessageOrigin,
}

impl Default for AlertMessage {
  fn default() -> Self {
    AlertMessage::success()
  }
}

impl AlertMessage {
  pub fn simple(title: impl AsRef<str>) -> Self {
    Self {
      title: title.as_ref().to_string(),
      body: None,
      origin: MessageOrigin::Alarmmgr,
    }
  }

  pub fn with_body(title: impl AsRef<str>, body: impl AsRef<str>) -> Self {
    Self {
      title: title.as_ref().to_string(),
      body: Some(body.as_ref().to_string()),
      origin: MessageOrigin::Alarmmgr,
    }
  }

  pub fn success() -> Self {
    Self {
      title: "success".to_string(),
      body: None,
      origin: MessageOrigin::Alarmmgr,
    }
  }
}

impl AlertMessage {
  fn next_id(&self) -> String {
    SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .expect("Unreachable")
      .as_millis()
      .to_string()
  }

  pub fn p1(&self, mark: ProbeMark) -> AlertInfo {
    AlertInfo::P1 {
      id: self.next_id(),
      mark,
      message: self.clone(),
    }
  }
  pub fn p2(&self, mark: ProbeMark) -> AlertInfo {
    AlertInfo::P2 {
      id: self.next_id(),
      mark,
      message: self.clone(),
    }
  }
  pub fn p3(&self, mark: ProbeMark) -> AlertInfo {
    AlertInfo::P3 {
      id: self.next_id(),
      mark,
      message: self.clone(),
    }
  }
  pub fn normal(&self, mark: ProbeMark) -> AlertInfo {
    AlertInfo::Normal {
      id: self.next_id(),
      mark,
    }
  }
}

/// message origin
#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum MessageOrigin {
  Alarmmgr,
}
