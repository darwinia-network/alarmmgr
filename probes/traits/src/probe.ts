/**
 * alarm probe
 */
export interface AlarmProbe {
  probe(): Promise<void>;
}
