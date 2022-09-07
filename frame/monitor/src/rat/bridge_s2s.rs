use std::time::Duration;

use substorager::{StorageHasher, StorageKey};

use alarmmgr_toolkit::logk;

use crate::error::MonitorResult;
use crate::rat::_helpers::{CheckDataInput, SubstrateLikeCheck};
use crate::traits::MonitorProbe;
use crate::types::{AlertInfo, ProbeMark};

pub use self::types::*;

/// bridge S2S probe
#[allow(dead_code)]
pub struct BridgeS2SProbe {
  config: BridgeS2SProbeConfig,
}

impl BridgeS2SProbe {
  pub fn new(config: BridgeS2SProbeConfig) -> Self {
    Self { config }
  }
}

#[async_trait::async_trait]
impl MonitorProbe for BridgeS2SProbe {
  async fn probe(&self) -> MonitorResult<Vec<AlertInfo>> {
    Ok(vec![
      self.check_outbound_lane().await?,
      self.check_grandpa().await?,
    ])
  }
}

impl BridgeS2SProbe {
  fn check_data_input(&self, storage_name: &str, storage_key: StorageKey) -> CheckDataInput {
    CheckDataInput {
      chain: self.config.chain.clone(),
      pallet_name: self.config.pallet_name.clone(),
      endpoint: self.config.endpoint.clone(),
      storage_name: storage_name.to_string(),
      storage_key,
      allow_time: Duration::from_secs(5 * 60),
    }
  }

  async fn check_grandpa(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check grandpa",
      logk::prefix_multi("monitor", vec!["bridge-s2s", &self.config.chain]),
    );
    let storage_name = "BestFinalized";
    let storage_key = StorageKey::builder(&self.config.pallet_name, storage_name).build();
    let input = self.check_data_input(storage_name, storage_key);
    let alert_message = SubstrateLikeCheck::check_storage_active(input).await?;
    Ok(alert_message.to_alert_info(ProbeMark::BridgeS2sGrandpa {
      chain: self.config.chain.clone(),
    }))
  }

  async fn check_outbound_lane(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check outbound lane",
      logk::prefix_multi("monitor", vec!["bridge-s2s", &self.config.chain]),
    );
    let storage_name = "OutboundLanes";
    let storage_key = StorageKey::builder(&self.config.pallet_name, storage_name)
      .param(StorageHasher::Blake2_128Concat, &self.config.lane_id)
      .build();
    let input = self.check_data_input(storage_name, storage_key);
    let alert_message = SubstrateLikeCheck::check_storage_active(input).await?;
    Ok(alert_message.to_alert_info(ProbeMark::BridgeS2sGrandpa {
      chain: self.config.chain.clone(),
    }))
  }
}

mod types {
  use serde::{Deserialize, Serialize};

  /// s2s probe config
  #[derive(Clone, Debug, Deserialize, Serialize)]
  pub struct BridgeS2SProbeConfig {
    pub endpoint: String,
    pub chain: String,
    pub lane_id: [u8; 4],
    pub pallet_name: String,
  }

  /// outbound lane data
  #[derive(Clone, Debug, Deserialize, Serialize)]
  pub struct OutboundLaneData {
    pub oldest_unpruned_nonce: subtypes::Nonce,
    pub latest_received_nonce: subtypes::Nonce,
    pub latest_generated_nonce: subtypes::Nonce,
  }
}
