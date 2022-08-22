use crate::error::MonitorResult;
use alarmmgr_types::config::Config;

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
  pub fn listen(&self) -> MonitorResult<()> {
    println!("{:?}", self.config);
    Ok(())
  }
}
