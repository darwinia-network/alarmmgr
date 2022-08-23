use serde::{Deserialize, Serialize};

/// Notify input message
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NotifyMessage {
  /// message title
  pub title: String,
  /// message body
  pub body: String,
}
