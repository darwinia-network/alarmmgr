use std::{collections::HashMap, sync::Mutex};

use alarmmgr_notification::types::SlackMessageDetail;
use once_cell::sync::Lazy;

use alarmmgr_toolkit::{logk, timek};

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
      Some(mut message) => {
        message.slack = self.config.slack.clone().map(|item| SlackMessageDetail {
          channel: item.channel,
          icon_emoji: item.icon_emoji,
        });

        let is_notify = self.check_and_store_notify(info);
        tracing::trace!(
          target: "alarmmgr",
          "{} new alert info [{}]: {}",
          logk::prefix_multi("monitor", vec!["notify"]),
          info.mark(),
          info.message().map(|m| format!("{} {}", m.title, m.body.unwrap_or_default())).unwrap_or_default(),
        );
        if !is_notify {
          return;
        }
        for notification in &self.notifications {
          tracing::trace!(
            target: "alarmmgr",
            "{} send message to [{}]: {}",
            logk::prefix_multi("monitor", vec!["notify"]),
            notification.name(),
            serde_json::to_string(info).expect("Unreachable"),
          );
          if let Err(e) = notification.notify(message.clone()).await {
            tracing::error!(
              target: "alarmmgr",
              "{} failed to send notification: {:?}",
              logk::prefix_multi("monitor", vec!["notify"]),
              e,
            );
          }
        }
      }
      None => {
        tracing::debug!(
          target: "alarmmgr",
          "{} not an alert message: {}",
          logk::prefix_multi("monitor", vec!["notify"]),
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

    match nm.get(&mark[..]) {
      Some(m) => {
        if m.notify_times > 3 {
          self.clean_notify(info);
          return false;
        }
        let now = timek::timestamp();
        if now <= m.time_next {
          tracing::info!(
            target: "alarmmgr",
            "{} The last notification cycle is still valid",
            logk::prefix_multi("monitor", vec!["notify"]),
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
          time_notified: timek::timestamp(),
          time_next: self.next_notify_timestamp(1),
          notify_times: 1,
        };
        nm.insert(mark, notified_message);
        true
      }
    }
  }

  fn next_notify_timestamp(&self, times: u32) -> u128 {
    let ts = timek::timestamp();
    let one_minutes = 1000 * 60;
    match times {
      1 => ts + one_minutes * 2, // 2 mins
      2 => ts + one_minutes * 5,
      3 => ts + one_minutes * 15,
      _ => 0,
    }
  }
}
