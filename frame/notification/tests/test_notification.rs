use alarmmgr_notification::platform::slack::{SlackConfig, SlackNotification};
use alarmmgr_notification::traits::AlarmmgrNotification;
use alarmmgr_notification::types::{NotifyMessage, SlackMessageDetail};

fn slack_notification() -> SlackNotification {
  SlackNotification::new(SlackConfig {
    endpoint: std::env::var("SLACK_ENDPOINT").unwrap(),
  })
}

#[tokio::test]
#[cfg(feature = "slack")]
#[ignore]
async fn test_slack_notification() {
  let notification = slack_notification();
  let message = NotifyMessage {
    title: "Alert test message".to_string(),
    body: "Message body".to_string(),
    level: None,
    slack: Some(SlackMessageDetail {
      channel: "darwinia-alert-notification".to_string(),
      icon_emoji: None,
    }),
  };
  notification.notify(message).await.unwrap();
}
