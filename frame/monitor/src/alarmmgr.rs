use alarmmgr_notification::traits::AlarmmgrNotification;
use alarmmgr_notification::types::NotifyMessage;
use alarmmgr_toolkit::logk;
use alarmmgr_types::config::Config;

use crate::error::MonitorResult;
use crate::traits::{MonitorProbe, ProbeReporter};
use crate::types::AlertInfo;

/// alarmmgr monitor
pub struct AlarmmgrMonitor {
  config: Config,
  probes: Vec<Box<dyn MonitorProbe>>,
  notifications: Vec<Box<dyn AlarmmgrNotification>>,
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
  pub async fn listen(&self) -> MonitorResult<()> {
    for probe in &self.probes {
      let infos = probe.probe().await?;
      self.notify_infos(infos).await;
    }
    Ok(())
  }
}

impl AlarmmgrMonitor {
  async fn notify_infos(&self, infos: Vec<AlertInfo>) {
    for info in infos {
      self.notify_info(&info).await;
    }
  }

  async fn notify_info(&self, info: &AlertInfo) {
    match info.to_notify_message() {
      Some(message) => {
        for notification in &self.notifications {
          tracing::trace!(
              target: "alarmmgr",
              "{} send message to [{}]: {}",
              logk::prefix_single("monitor"),
              notification.name(),
              serde_json::to_string(info).expect("Unreachable"),
          );
          if let Err(e) = notification.notify(message.clone()).await {
            tracing::error!(
              target: "alarmmgr",
              "{} failed to send notification: {:?}",
              logk::prefix_single("monitor"),
              e,
            );
          }
        }
      }
      None => {
        tracing::trace!(
          target: "alarmmgr",
          "{} not alert message: {}",
          logk::prefix_single("monitor"),
          serde_json::to_string(info).expect("Unreachable"),
        );
      }
    }
  }
}
