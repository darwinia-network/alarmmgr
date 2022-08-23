use alarmmgr_toolkit::logk;
use alarmmgr_types::config::Config;

use crate::error::MonitorResult;

/// alarmmgr monitor
pub struct AlarmmgrMonitor {
  config: Config,
}

impl AlarmmgrMonitor {
  /// create monitor instance
  pub fn new(config: Config) -> Self {
    Self { config }
  }
}

impl AlarmmgrMonitor {
  /// monitor listen
  pub async fn listen(&self) -> MonitorResult<()> {
    println!("{:?}", self.config);
    tracing::trace!(
      target: "alarmmgr",
      "{} config data: {:?}",
      logk::prefix_multi("monitor", vec!["test"]),
      self.config
    );
    Ok(())
  }
}
