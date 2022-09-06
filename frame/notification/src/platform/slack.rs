use slack_hook::{AttachmentBuilder, Field, PayloadBuilder, Slack, SlackText, SlackTextContent};

use crate::error::NotificationResult;
use crate::traits::AlarmmgrNotification;
use crate::types::NotifyMessage;

#[derive(Clone)]
pub struct SlackConfig {
  pub endpoint: String,
}

#[derive(Clone)]
pub struct SlackNotification {
  config: SlackConfig,
}

impl SlackNotification {
  pub fn new(config: SlackConfig) -> Self {
    Self { config }
  }
}

#[async_trait::async_trait]
impl AlarmmgrNotification for SlackNotification {
  fn name(&self) -> String {
    "slack".to_string()
  }

  async fn notify(&self, message: NotifyMessage) -> NotificationResult<()> {
    let detail = message.slack.clone().unwrap_or_default();
    let level = message.level.map(|item| item.view()).unwrap_or("NONE");
    let slack = Slack::new(&self.config.endpoint[..])?;
    let p = PayloadBuilder::new()
      .text(&*vec![SlackTextContent::Text(message.title.into())])
      .attachments(vec![
        AttachmentBuilder::new(message.body)
          .color("#b13d41")
          .build()
          .expect("Unreachable"),
        AttachmentBuilder::new(format!("Priority: {}", level))
          .fields(vec![Field::new("Priority", SlackText::new(level), None)])
          .build()
          .expect("Unreachable"),
      ])
      .channel(format!("#{}", detail.channel))
      .username("Alarmmgr")
      // .icon_url("https://github.githubassets.com/images/modules/profile/achievements/pair-extraordinaire-default.png")
      .icon_emoji(detail.icon_emoji.unwrap_or_else(|| ":alert:".to_string()))
      .build()
      .expect("Unreachable");

    let json = serde_json::to_string(&p).unwrap();
    // todo: change send to slack
    println!("{}", json);
    // slack.send(&p)?;
    Ok(())
  }
}
