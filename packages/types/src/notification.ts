
export class Alerts {
  private readonly _alerts: Array<Alert>;

  constructor() {
    this._alerts = [];
  }

  public static create(): Alerts {
    return new Alerts();
  }

  public push(alert: Alert): Alerts {
    this._alerts.push(alert);
    return this;
  }

  public merge(alerts: Array<Alert>): Alerts {
    this._alerts.push(...alerts);
    return this;
  }

  public mergeWithAlerts(alerts: Alerts): Alerts {
    return this.merge(alerts._alerts);
  }

  public clear(): Alerts {
    if (this._alerts.length === 0)
      return this;
    this._alerts.splice(0, this._alerts.length);
    return this;
  }

  public alerts(): Array<Alert> {
    return this._alerts;
  }

}

/**
 * alert
 */
export interface Alert {
  level: Level,
  id?: string,
  mark:string,
  title: string,
  body?: string,
}

export enum Level {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
}

