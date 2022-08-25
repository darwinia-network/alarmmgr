use alarmmgr_toolkit::logk;
use alarmmgr_types::config::Config;

use crate::error::MonitorResult;
use crate::traits::MonitorProbe;

/// alarmmgr monitor
pub struct AlarmmgrMonitor {
  config: Config,
  probes: Vec<Box<dyn MonitorProbe>>,
}

impl AlarmmgrMonitor {
  /// create monitor instance
  pub fn new(config: Config) -> Self {
    Self {
      config,
      probes: vec![],
    }
  }
}

impl AlarmmgrMonitor {
  /// add probe
  pub fn probe<P: 'static + MonitorProbe>(&mut self, probe: P) -> &mut Self {
    self.probes.push(Box::new(probe));
    self
  }

  /// monitor listen
  pub async fn listen(&self) -> MonitorResult<()> {
    for probe in &self.probes {
      let infos = probe.probe().await?;
      infos
        .iter()
        .for_each(|item| println!("{}", serde_json::to_string(item).unwrap()));
    }
    Ok(())
  }
}
