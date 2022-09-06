use alarmmgr_notification::traits::AlarmmgrNotification;
use alarmmgr_types::config::Config;

use crate::error::MonitorResult;
use crate::traits::MonitorProbe;

/// alarmmgr monitor
#[allow(dead_code)]
pub struct AlarmmgrMonitor {
  pub(crate) config: Config,
  pub(crate) probes: Vec<Box<dyn MonitorProbe>>,
  pub(crate) notifications: Vec<Box<dyn AlarmmgrNotification>>,
}

impl AlarmmgrMonitor {
  /// create monitor instance
  pub fn new(config: Config) -> Self {
    Self {
      config,
      probes: vec![],
      notifications: vec![],
    }
  }
}

impl AlarmmgrMonitor {
  /// add probe
  pub fn probe<P: 'static + MonitorProbe>(&mut self, probe: P) -> &mut Self {
    self.probes.push(Box::new(probe));
    self
  }

  // add notification
  pub fn notification<N: 'static + AlarmmgrNotification>(&mut self, notification: N) -> &mut Self {
    self.notifications.push(Box::new(notification));
    self
  }

  /// monitor listen
  pub async fn start(&self) -> MonitorResult<()> {
    for probe in &self.probes {
      let infos = probe.probe().await?;
      self.notify_infos(infos).await;
    }
    Ok(())
  }
}
