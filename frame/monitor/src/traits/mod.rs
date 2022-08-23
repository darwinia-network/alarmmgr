use crate::error::MonitorResult;

/// monitor probe
#[async_trait::async_trait]
pub trait MonitorProbe {
  /// do probe
  async fn probe(&self) -> MonitorResult<AlertInfo>;
}

/// probe data
pub enum AlertInfo {
  Normal,
  P1,
  P2,
  P3,
}
