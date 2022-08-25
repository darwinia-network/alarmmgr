use alarmmgr_monitor::rat::{
  BridgeS2SProbe, BridgeS2SProbeConfig, FeemarketS2SProbe, FeemarketS2SProbeConfig,
};
use alarmmgr_monitor::AlarmmgrMonitor;

use crate::error::CliResult;
use crate::types::StartCommand;

pub async fn exec_start(command: StartCommand) -> CliResult<()> {
  let config = command.try_into()?;
  let mut alarmmgr = AlarmmgrMonitor::new(config);
  add_probes(&mut alarmmgr);
  alarmmgr.listen().await?;
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
