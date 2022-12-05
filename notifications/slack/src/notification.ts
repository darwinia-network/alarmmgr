import {Alert} from "alarmmgr-types";
import {AlarmNotification} from "alarmmgr-notification-traits";
import {IncomingWebhook} from "@slack/webhook";
import {logger} from "alarmmgr-logger";

export class SlackNotification implements AlarmNotification {

  private readonly webhook?: IncomingWebhook;

  constructor(
    private readonly config: SlackWebhookConfig,
  ) {
    if (this.config.endpoint) {
      this.webhook = new IncomingWebhook(config.endpoint);
    }
  }

  async notify(alerts: Array<Alert>): Promise<void> {
    if (!this.webhook) {
      logger.warn('missing slack webhook url, nothing to do.');
      return;
    }

    const blocks = [];
    let ix = 0;
    for (const alert of alerts) {
      ix += 1;
      blocks.push({
        type: 'section',
        text: {type: 'mrkdwn', text: alert.title},
        // @ts-ignore
        fields: [
          {type: 'mrkdwn', text: `*Priority:*\n${alert.priority}`},
          {type: 'mrkdwn', text: `*Mark:*\n${alert.mark}`},
          {type: 'mrkdwn', text: `*Message:*\n\n${alert.body}`}
        ],
      });
      if (ix == alerts.length){
        break;
      }
      blocks.push({type: 'divider'});
    }

    await this.webhook.send({
      username: 'Alarmmgr',
      icon_emoji: ':loudspeaker:',
      channel: this.config.channel,
      blocks,
    });

  }
}

export interface SlackWebhookConfig {
  endpoint: string,
  channel: string,
}
