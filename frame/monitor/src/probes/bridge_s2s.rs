use std::time::Duration;

use substorager::{StorageHasher, StorageKey};

use alarmmgr_notification::types::AlertLevel;
use alarmmgr_toolkit::logk;

use crate::client::Subclient;
use crate::error::MonitorResult;
use crate::probes::_helpers::{CheckDataInput, CheckedActiveType, SubstrateLikeCheck};
use crate::traits::MonitorProbe;
use crate::types::{AlertInfo, AlertMessage, ProbeMark};

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
  fn check_data_input(
    &self,
    cache_name: impl AsRef<str>,
    storage_key: StorageKey,
  ) -> CheckDataInput {
    CheckDataInput {
      cache_name: cache_name.as_ref().to_string(),
      endpoint: self.config.endpoint.clone(),
      storage_key,
      allow_time: Duration::from_secs(5 * 60),
    }
  }

  async fn check_grandpa(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check grandpa",
      logk::prefix_multi("monitor", vec!["bridge-s2s", &self.config.bridge]),
    );
    let storage_name = "BestFinalized";
    let cache_name = format!("bridge-s2s-grandpa-{}", self.config.bridge);
    let storage_key = StorageKey::builder(&self.config.pallet_grandpa, storage_name).build();
    let input = self.check_data_input(cache_name, storage_key);
    let checked_active_type = SubstrateLikeCheck::check_storage_active(input).await?;
    let alert_message = match checked_active_type {
      CheckedActiveType::Pass => AlertMessage::success(),
      CheckedActiveType::NoData => AlertMessage::simple(
        AlertLevel::P3,
        format!(
          "[{}] [{}::{}] [{}] not have best target chain head",
          self.config.bridge, self.config.pallet_grandpa, storage_name, self.config.endpoint
        ),
      ),
      CheckedActiveType::Dead { out_time } => AlertMessage::simple(
        AlertLevel::P1,
        format!(
          "[{}] [{}::{}] [{}] the grandpa stopped {} seconds",
          self.config.bridge,
          self.config.pallet_grandpa,
          storage_name,
          self.config.endpoint,
          out_time.as_secs(),
        ),
      ),
    };
    Ok(alert_message.to_alert_info(ProbeMark::BridgeS2sGrandpa {
      chain: self.config.bridge.clone(),
    }))
  }

  async fn check_outbound_lane(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check outbound lane",
      logk::prefix_multi("monitor", vec!["bridge-s2s", &self.config.bridge]),
    );
    let storage_name = "OutboundLanes";
    let cache_name = format!("bridge-s2s-outbound-lane-{}", self.config.bridge);
    let storage_key = StorageKey::builder(&self.config.pallet_message, storage_name)
      .param(StorageHasher::Blake2_128Concat, &self.config.lane_id)
      .build();
    let client = Subclient::new(&self.config.endpoint)?;
    let outbound_lane_data: Option<OutboundLaneData> = client.storage(&storage_key).await?;
    match outbound_lane_data {
      Some(lane_data) => {
        if lane_data.latest_generated_nonce == lane_data.latest_received_nonce {
          return Ok(
            AlertMessage::success().to_alert_info(ProbeMark::BridgeS2sOutboundLane {
              chain: self.config.bridge.clone(),
            }),
          );
        }
      }
      None => {
        return Ok(
          AlertMessage::success().to_alert_info(ProbeMark::BridgeS2sOutboundLane {
            chain: self.config.bridge.clone(),
          }),
        )
      }
    }
    let input = self.check_data_input(cache_name, storage_key);
    let checked_active_type = SubstrateLikeCheck::check_storage_active(input).await?;
    let alert_message = match checked_active_type {
      CheckedActiveType::Pass => AlertMessage::success(),
      CheckedActiveType::NoData => AlertMessage::simple(
        AlertLevel::P3,
        format!(
          "[{}] [{}::{}] [{}] not have outbound lane data",
          self.config.bridge, self.config.pallet_message, storage_name, self.config.endpoint
        ),
      ),
      CheckedActiveType::Dead { out_time } => AlertMessage::simple(
        AlertLevel::P1,
        format!(
          "[{}] [{}::{}] [{}] maybe the bridger stopped {} seconds",
          self.config.bridge,
          self.config.pallet_message,
          storage_name,
          self.config.endpoint,
          out_time.as_secs(),
        ),
      ),
    };
    Ok(
      alert_message.to_alert_info(ProbeMark::BridgeS2sOutboundLane {
        chain: self.config.bridge.clone(),
      }),
    )
  }
}

mod types {
  use parity_scale_codec::{Decode, Encode};
  use serde::{Deserialize, Serialize};

  /// s2s probe config
  #[derive(Clone, Debug, Deserialize, Serialize)]
  pub struct BridgeS2SProbeConfig {
    pub endpoint: String,
    pub bridge: String,
    pub lane_id: [u8; 4],
    pub pallet_grandpa: String,
    pub pallet_message: String,
  }

  /// outbound lane data
  #[derive(Clone, Debug, Deserialize, Serialize, Encode, Decode)]
  pub struct OutboundLaneData {
    pub oldest_unpruned_nonce: subtypes::Nonce,
    pub latest_received_nonce: subtypes::Nonce,
    pub latest_generated_nonce: subtypes::Nonce,
  }
}
