use alarmmgr_monitor::rat::{
  BridgeS2SProbe, BridgeS2SProbeConfig, FeemarketS2SProbe, FeemarketS2SProbeConfig,
};
use alarmmgr_monitor::AlarmmgrMonitor;
use alarmmgr_notification::platform::slack::{SlackConfig, SlackNotification};
use alarmmgr_notification::platform::terminal::TerminalNotification;
use alarmmgr_toolkit::logk;

use crate::error::CliResult;
use crate::types::StartCommand;

pub async fn exec_start(command: StartCommand) -> CliResult<()> {
  let config = command.try_into()?;
  let mut alarmmgr = AlarmmgrMonitor::new(config);
  add_probes(&mut alarmmgr)?;
  add_notifications(&mut alarmmgr);
  listen(&alarmmgr).await;
  Ok(())
}

async fn listen(alarmmgr: &AlarmmgrMonitor) {
  loop {
    if let Err(e) = alarmmgr.start().await {
      tracing::error!(
        target: "alarmmgr",
        "{} monitor failed: {:?}",
        logk::prefix_single("monitor"),
        e,
      );
    }
    tracing::info!(
      target: "alarmmgr",
      "{} === check done. wait 10 seconds to next round. ===",
       logk::prefix_single("monitor"),
    );
    tokio::time::sleep(std::time::Duration::from_secs(10)).await;
  }
}

fn add_notifications(alarmmgr: &mut AlarmmgrMonitor) {
  alarmmgr.notification(TerminalNotification);
  if let Ok(endpoint) = std::env::var("ALM_SLACK_ENDPOINT") {
    alarmmgr.notification(SlackNotification::new(SlackConfig { endpoint }));
    tracing::info!(
      target: "alarmmgr",
      "{} add new notification [slack]",
      logk::prefix_single("monitor"),
    );
  }
}

fn add_probes(alarmmgr: &mut AlarmmgrMonitor) -> CliResult<()> {
  //# bridge s2s
  alarmmgr.probe(BridgeS2SProbe::new(BridgeS2SProbeConfig {
    endpoint: "https://pangoro-rpc.darwinia.network".to_string(),
    chain: "Pangoro".to_string(),
    lane_id: array_bytes::hex2array("0x726f6c69")?,
    pallet_name: "BridgePangolinGrandpa".to_string(),
  }));

  //# feemarket s2s
  alarmmgr.probe(FeemarketS2SProbe::new(FeemarketS2SProbeConfig {
    endpoint: "https://rpc.darwinia.network".to_string(),
    chain: "Darwinia".to_string(),
    pallet_name: "FeeMarket".to_string(),
  }));
  Ok(())
}
