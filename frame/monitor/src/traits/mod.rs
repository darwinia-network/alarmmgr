use crate::error::MonitorResult;
use crate::types::AlertInfo;

/// monitor probe
#[async_trait::async_trait]
pub trait MonitorProbe {
  /// do probe
  async fn probe(&self) -> MonitorResult<Vec<AlertInfo>>;
}

/// probe reporter
pub trait ProbeReporter {
  /// identify
  fn id(&self) -> String;

  /// probe mark
  fn mark(&self) -> String;
}
