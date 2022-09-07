use substorager::StorageKey;

use alarmmgr_toolkit::{logk, timek};

use crate::client::Subclient;
use crate::error::MonitorResult;
use crate::storage;
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
  fn client(&self) -> MonitorResult<Subclient> {
    Subclient::new(&self.config.endpoint)
  }

  async fn check_grandpa(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check grandpa",
      logk::prefix_multi("monitor", vec!["bridge-s2s", &self.config.chain]),
    );
    let client = self.client()?;
    let storage_key = StorageKey::builder(&self.config.pallet_name, "BestFinalized").build();
    let best_target_head = client.storage_raw(storage_key).await?;
    let store_name = format!("bridge-s2s-grandpa-{}", self.config.chain);
    match best_target_head {
      Some(best_finalized) => match storage::last_range_data(&store_name) {
        Some(rs) => {
          let time_range = timek::time_range_with_now(rs.time).as_secs();
          if rs.last == best_finalized && timek::time_range_with_now(rs.time).as_secs() > 5 * 60 {
            return Ok(
              AlertMessage::simple(format!(
                "[{}] [{}] [{}] the grandpa stopped {} seconds",
                self.config.chain, self.config.pallet_name, self.config.endpoint, time_range,
              ))
              .p1(ProbeMark::BridgeS2sGrandpaEmptyBestTargetHead {
                chain: self.config.chain.clone(),
              }),
            );
          }
          Ok(AlertMessage::success().normal_simple("bridge-s2s-grandpa"))
        }
        None => {
          storage::store_last_range_data(&store_name, best_finalized);
          Ok(AlertMessage::success().normal_simple("bridge-s2s-grandpa"))
        }
      },
      None => Ok(
        AlertMessage::simple(format!(
          "[{}] [{}] [{}] not have best target chain head",
          self.config.chain, self.config.pallet_name, self.config.endpoint
        ))
        .p3(ProbeMark::BridgeS2sGrandpaEmptyBestTargetHead {
          chain: self.config.chain.clone(),
        }),
      ),
    }
  }

  async fn check_outbound_lane(&self) -> MonitorResult<AlertInfo> {
    tracing::trace!(
      target: "alarmmgr",
      "{} ==> check outbound lane",
      logk::prefix_multi("monitor", vec!["bridge-s2s", &self.config.chain]),
    );

    let client = self.client()?;
    let storage_key = StorageKey::builder(&self.config.pallet_name, "AssignedRelayers").build();

    Ok(AlertMessage::success().normal(ProbeMark::generic_default()))
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
