use std::ops::Deref;

use parity_scale_codec::Decode;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use substorager::StorageKey;

use alarmmgr_toolkit::logk;

use crate::error::MonitorResult;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RpcResponse {
  pub jsonrpc: String,
  pub id: u64,
  // #[serde(with = "SerHexOpt::<StrictPfx>")]
  pub result: Option<String>,
}

impl RpcResponse {
  pub fn result_bytes(&self) -> MonitorResult<Option<Vec<u8>>> {
    match &self.result {
      Some(v) => Ok(Some(array_bytes::hex2bytes(v)?)),
      None => Ok(None),
    }
  }
}

#[derive(Clone, Debug)]
pub struct Subclient {
  endpoint: String,
  client: Client,
}

impl Subclient {
  pub fn new(endpoint: impl AsRef<str>) -> MonitorResult<Self> {
    let client = Client::builder()
      .timeout(std::time::Duration::from_secs(30))
      .build()?;
    Ok(Self {
      endpoint: endpoint.as_ref().to_string(),
      client,
    })
  }
}

impl Subclient {
  async fn fetch_storage(&self, storage_key: &StorageKey) -> MonitorResult<RpcResponse> {
    let param = array_bytes::bytes2hex("0x", storage_key.deref());
    let reqbody = format!(
      r#"{{"id":1,"jsonrpc":"2.0","method":"state_getStorage","params":["{}"]}}"#,
      param
    );
    tracing::trace!(
      target: "alarmmgr",
      "{} --> [{}] {}",
      logk::prefix_single("subclient"),
      self.endpoint,
      reqbody,
    );
    let response = self
      .client
      .post(&self.endpoint)
      .header("Content-Type", "application/json")
      .body(reqbody)
      .send()
      .await?;
    let respbody = response.text().await?;
    tracing::trace!(
      target: "alarmmgr",
      "{} <-- [{}] {}",
      logk::prefix_single("subclient"),
      self.endpoint,
      respbody,
    );
    Ok(serde_json::from_str(&respbody)?)
  }

  /// query storage raw
  pub async fn storage_raw(&self, storage_key: &StorageKey) -> MonitorResult<Option<String>> {
    let rpc_resp = self.fetch_storage(storage_key).await?;
    Ok(rpc_resp.result)
  }

  /// query storage
  pub async fn storage<R: Decode>(&self, storage_key: &StorageKey) -> MonitorResult<Option<R>> {
    let rpc_resp = self.fetch_storage(storage_key).await?;
    match rpc_resp.result_bytes()? {
      Some(v) => Ok(Some(Decode::decode(&mut v.as_slice())?)),
      None => Ok(None),
    }
  }
}
