use std::time::{SystemTime, UNIX_EPOCH};
use std::{collections::HashMap, sync::Mutex};

use once_cell::sync::Lazy;

use alarmmgr_toolkit::logk;

use crate::alarmmgr::types::NotifiedMessage;
use crate::traits::ProbeReporter;
use crate::types::AlertInfo;
use crate::AlarmmgrMonitor;

static NOTIFIED_MESSAGE: Lazy<Mutex<HashMap<String, NotifiedMessage>>> =
  Lazy::new(|| Mutex::new(HashMap::new()));

impl AlarmmgrMonitor {
  pub(crate) async fn notify_infos(&self, infos: Vec<AlertInfo>) {
    for info in infos {
      self.notify_info(&info).await;
    }
  }

  async fn notify_info(&self, info: &AlertInfo) {
    match info.to_notify_message() {
      Some(message) => {
        let is_notify = self.check_and_store_notify(info);
        if !is_notify {
          return;
        }
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
          "{} not an alert message: {}",
          logk::prefix_single("monitor"),
          serde_json::to_string(info).expect("Unreachable"),
        );
      }
    }
  }

  fn clean_notify(&self, info: &AlertInfo) {
    let mark = info.mark();
    let mut nm = NOTIFIED_MESSAGE.lock().expect("Unreachable");
    nm.remove(&mark);
  }

  fn check_and_store_notify(&self, info: &AlertInfo) -> bool {
    let mark = info.mark();
    let mut nm = NOTIFIED_MESSAGE.lock().expect("Unreachable");

    match nm.get("mark") {
      Some(m) => {
        if m.notify_times > 3 {
          self.clean_notify(info);
          return false;
        }
        let now = self.timestamp();
        if now <= m.time_next {
          tracing::info!(
            target: "alarmmgr",
            "{} The last notification cycle is still valid",
            logk::prefix_single("monitor"),
          );
          return false;
        }
        let mut new_nm = m.clone();
        new_nm.time_notified = now;
        new_nm.notify_times += 1;
        new_nm.time_next = self.next_notify_timestamp(new_nm.notify_times);
        nm.insert(mark, new_nm);
        true
      }
      None => {
        let notified_message = NotifiedMessage {
          time_notified: self.timestamp(),
          time_next: self.next_notify_timestamp(1),
          notify_times: 1,
        };
        nm.insert(mark, notified_message);
        true
      }
    }
  }

  fn timestamp(&self) -> u128 {
    let start = SystemTime::now();
    let since_the_epoch = start
      .duration_since(UNIX_EPOCH)
      .expect("Time went backwards");
    since_the_epoch.as_millis()
  }

  fn next_notify_timestamp(&self, times: u32) -> u128 {
    let ts = self.timestamp();
    let one_minutes = 1000 * 60;
    match times {
      1 => ts + one_minutes * 2, // 2 mins
      2 => ts + one_minutes * 5,
      3 => ts + one_minutes * 10,
      _ => 0,
    }
  }
}