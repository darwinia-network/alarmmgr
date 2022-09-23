use alarmmgr_monitor::probes::{
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
  let configs_bridge_s2s = vec![
    // pangoro -> pangolin
    BridgeS2SProbeConfig {
      endpoint: "https://pangoro-rpc.darwinia.network".to_string(),
      bridge: "pangoro>pangolin".to_string(),
      lane_id: array_bytes::hex2array("0x726f6c69")?,
      pallet_grandpa: "BridgePangolinGrandpa".to_string(),
      pallet_message: "BridgePangolinMessages".to_string(),
    },
    // pangolin -> pangoro
    BridgeS2SProbeConfig {
      endpoint: "https://pangolin-rpc.darwinia.network".to_string(),
      bridge: "pangolin>pangoro".to_string(),
      lane_id: array_bytes::hex2array("0x726f6c69")?,
      pallet_grandpa: "BridgePangoroGrandpa".to_string(),
      pallet_message: "BridgePangoroMessages".to_string(),
    },
    // pangolin -> pangolin parachain
    BridgeS2SProbeConfig {
      endpoint: "https://pangolin-rpc.darwinia.network".to_string(),
      bridge: "pangolin>pangolinparachain".to_string(),
      lane_id: array_bytes::hex2array("0x70616c69")?,
      pallet_grandpa: "BridgeRococoGrandpa".to_string(),
      pallet_message: "BridgePangolinParachainMessages".to_string(),
    },
    // pangolin parachain -> pangolin
    BridgeS2SProbeConfig {
      endpoint: "https://pangolin-parachain-rpc.darwinia.network".to_string(),
      bridge: "pangolinparachain>pangolin".to_string(),
      lane_id: array_bytes::hex2array("0x70616c69")?,
      pallet_grandpa: "BridgePangolinGrandpa".to_string(),
      pallet_message: "BridgePangolinMessages".to_string(),
    },
    // darwinia -> crab
    BridgeS2SProbeConfig {
      endpoint: "https://rpc.darwinia.network".to_string(),
      bridge: "darwinia>crab".to_string(),
      lane_id: array_bytes::hex2array("0x00000000")?,
      pallet_grandpa: "BridgeCrabGrandpa".to_string(),
      pallet_message: "BridgeCrabMessages".to_string(),
    },
    // crab -> darwinia
    BridgeS2SProbeConfig {
      endpoint: "https://crab-rpc.darwinia.network".to_string(),
      bridge: "crab>darwinia".to_string(),
      lane_id: array_bytes::hex2array("0x00000000")?,
      pallet_grandpa: "BridgeDarwiniaGrandpa".to_string(),
      pallet_message: "BridgeDarwiniaMessages".to_string(),
    },
    // crab -> crab parachain
    BridgeS2SProbeConfig {
      endpoint: "https://crab-rpc.darwinia.network".to_string(),
      bridge: "crab>crabparachain".to_string(),
      lane_id: array_bytes::hex2array("0x70616372")?,
      pallet_grandpa: "BridgeKusamaGrandpa".to_string(),
      pallet_message: "BridgeCrabParachainMessages".to_string(),
    },
    // crab parachain -> crab
    BridgeS2SProbeConfig {
      endpoint: "https://crab-parachain-rpc.darwinia.network".to_string(),
      bridge: "crabparachain>crab".to_string(),
      lane_id: array_bytes::hex2array("0x70616372")?,
      pallet_grandpa: "BridgeCrabGrandpa".to_string(),
      pallet_message: "BridgeCrabMessages".to_string(),
    },
  ];
  for probe_config in configs_bridge_s2s {
    alarmmgr.probe(BridgeS2SProbe::new(probe_config));
  }

  //# feemarket s2s
  let config_feemarket_s2s = vec![
    // dawrinia -> crab
    FeemarketS2SProbeConfig {
      endpoint: "https://rpc.darwinia.network".to_string(),
      bridge: "darwinia>crab".to_string(),
      pallet_name: "FeeMarket".to_string(),
    },
    // crab -> dawrinia
    FeemarketS2SProbeConfig {
      endpoint: "https://crab-rpc.darwinia.network".to_string(),
      bridge: "crab>darwinia".to_string(),
      pallet_name: "DarwiniaFeeMarket".to_string(),
    },
    // pangolin -> pangoro
    FeemarketS2SProbeConfig {
      endpoint: "https://pangolin-rpc.darwinia.network".to_string(),
      bridge: "pangolin>pangoro".to_string(),
      pallet_name: "PangoroFeeMarket".to_string(),
    },
    // pangoro -> pangolin
    FeemarketS2SProbeConfig {
      endpoint: "https://pangoro-rpc.darwinia.network".to_string(),
      bridge: "pangoro>pangolin".to_string(),
      pallet_name: "PangolinFeeMarket".to_string(),
    },
    // pangolin -> pangolin parachain
    FeemarketS2SProbeConfig {
      endpoint: "https://pangolin-rpc.darwinia.network".to_string(),
      bridge: "pangolin>pangolinparachain".to_string(),
      pallet_name: "PangolinParachainFeeMarket".to_string(),
    },
    // pangolin parachain -> pangolin
    FeemarketS2SProbeConfig {
      endpoint: "https://pangolin-parachain-rpc.darwinia.network".to_string(),
      bridge: "pangolinparachain>pangolin".to_string(),
      pallet_name: "PangolinFeeMarket".to_string(),
    },
    // crab -> crab parachain
    FeemarketS2SProbeConfig {
      endpoint: "https://crab-rpc.darwinia.network".to_string(),
      bridge: "crab>crabparachain".to_string(),
      pallet_name: "CrabParachainFeeMarket".to_string(),
    },
    // crab parachain -> crab
    FeemarketS2SProbeConfig {
      endpoint: "https://crab-parachain-rpc.darwinia.network".to_string(),
      bridge: "crabparachain>crab".to_string(),
      pallet_name: "CrabFeeMarket".to_string(),
    },
  ];
  for config_feemarket_s2s in config_feemarket_s2s {
    alarmmgr.probe(FeemarketS2SProbe::new(config_feemarket_s2s));
  }
  Ok(())
}
