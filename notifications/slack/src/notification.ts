import {Alert} from "alarmmgr-types";
import {AlarmNotification} from "alarmmgr-notification-traits";
import {IncomingWebhook} from "@slack/webhook";

export class SlackNotification implements AlarmNotification {

  private readonly webhook: IncomingWebhook;

  constructor(
    private readonly config: SlackWebhookConfig,
  ) {
    this.webhook = new IncomingWebhook(config.endpoint);
  }

  async notify(alerts: Array<Alert>): Promise<void> {
    await this.webhook.send({
      username: 'Alarmmgr',
      channel: '#darwinia-alert-notification',
      text: 'I\'ve got news for you...',
    });
  }
}

export interface SlackWebhookConfig {
  endpoint: string,
}
