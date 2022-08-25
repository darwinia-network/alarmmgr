use slack_hook::{AttachmentBuilder, PayloadBuilder, Slack, SlackTextContent};

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
  async fn notify(&self, message: NotifyMessage) -> NotificationResult<()> {
    let detail = message.slack.clone().unwrap_or_default();
    let slack = Slack::new(&self.config.endpoint[..])?;
    let p = PayloadBuilder::new()
      .text(&*vec![SlackTextContent::Text(message.title.into())])
      .attachments(vec![AttachmentBuilder::new(message.body)
        .color("#b13d41")
        .build()
        .unwrap()])
      .channel(format!("#{}", detail.channel))
      .username("Alarmmgr")
      .icon_url("https://github.githubassets.com/images/modules/profile/achievements/pair-extraordinaire-default.png")
      // .icon_emoji(
      //   detail
      //     .icon_emoji
      //     .unwrap_or_else(|| ":chart_with_upwards_trend:".to_string()),
      // )
      .build()
      .unwrap();

    let json = serde_json::to_string(&p).unwrap();
    // println!("{}", json);
    slack.send(&p)?;
    Ok(())
  }
}
