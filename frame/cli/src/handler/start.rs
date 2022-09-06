use alarmmgr_monitor::rat::{
  BridgeS2SProbe, BridgeS2SProbeConfig, FeemarketS2SProbe, FeemarketS2SProbeConfig,
};
use alarmmgr_monitor::AlarmmgrMonitor;
use alarmmgr_notification::platform::slack::{SlackConfig, SlackNotification};

use alarmmgr_toolkit::logk;

use crate::error::CliResult;
use crate::types::StartCommand;

pub async fn exec_start(command: StartCommand) -> CliResult<()> {
  let config = command.try_into()?;
  let mut alarmmgr = AlarmmgrMonitor::new(config);
  add_probes(&mut alarmmgr);
  add_notifications(&mut alarmmgr);
  listen(&alarmmgr).await;
  Ok(())
}

fn add_probes(alarmmgr: &mut AlarmmgrMonitor) {
  alarmmgr.probe(BridgeS2SProbe::new(BridgeS2SProbeConfig {
    endpoint: "https://rpc.darwinia.network".to_string(),
    chain: "darwinia".to_string(),
    lane_id: [0x00, 0x00, 0x00, 0x00],
  }));
  alarmmgr.probe(FeemarketS2SProbe::new(FeemarketS2SProbeConfig {
    endpoint: "https://rpc.darwinia.network".to_string(),
    chain: "darwinia".to_string(),
    pallet_name: "FeeMarket".to_string(),
  }));
}

fn add_notifications(alarmmgr: &mut AlarmmgrMonitor) {
  alarmmgr.notification(SlackNotification::new(SlackConfig {
    endpoint: "".to_string(),
  }));
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
    tokio::time::sleep(std::time::Duration::from_secs(10)).await;
  }
}
