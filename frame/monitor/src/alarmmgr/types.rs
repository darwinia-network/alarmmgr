use serde::{Deserialize, Serialize};

/// notified message
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct NotifiedMessage {
  /// notified time
  pub time_notified: u128,
  /// next notified time,
  pub time_next: u128,
  /// notify times
  pub notify_times: u32,
}
