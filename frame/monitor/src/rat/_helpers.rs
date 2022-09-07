pub use self::common::*;
pub use self::substrate_like::*;
pub use self::traits::*;

mod common {
  use std::time::Duration;

  use alarmmgr_toolkit::timek;

  use crate::storage::RangeStorage;

  /// check range storage outdate
  pub fn check_out_time_range(
    current: impl AsRef<str>,
    rs: &RangeStorage,
    allow_time: Duration,
  ) -> Option<Duration> {
    let current = current.as_ref().to_string();
    let time_range = timek::time_range_with_now(rs.time);
    if rs.last == current && time_range.as_secs() > allow_time.as_secs() {
      Some(time_range)
    } else {
      None
    }
  }
}

mod traits {}

mod substrate_like {
  use std::time::Duration;

  use substorager::StorageKey;

  use alarmmgr_notification::types::AlertLevel;

  use crate::client::Subclient;
  use crate::error::MonitorResult;
  use crate::rat::_helpers::check_out_time_range;
  use crate::storage;
  use crate::types::AlertMessage;

  pub struct SubstrateLikeCheck {}

  impl SubstrateLikeCheck {
    /// check substrate chain storage not changed long time
    pub async fn check_storage_active(input: CheckDataInput) -> MonitorResult<AlertMessage> {
      let client = Subclient::new(&input.endpoint)?;
      let storage_result = client.storage_raw(input.storage_key).await?;
      if storage_result.is_none() {
        return Ok(AlertMessage::simple(
          AlertLevel::P3,
          format!(
            "[{}] [{}::{}] [{}] not have best target chain head",
            input.chain, input.pallet_name, input.storage_name, input.endpoint
          ),
        ));
      }

      // query last cached
      let storage_data = storage_result.expect("Unreachable");
      let cache_name = format!("bridge-s2s-grandpa-{}", input.chain);
      let last_cached = storage::last_range_data(&cache_name);
      if last_cached.is_none() {
        storage::store_last_range_data(cache_name, storage_data);
        return Ok(AlertMessage::success());
      }

      // check is it timeout
      let rs = last_cached.expect("Unreachable");
      let checked_out_time = check_out_time_range(storage_data, &rs, input.allow_time);
      if checked_out_time.is_none() {
        return Ok(AlertMessage::success());
      }

      let out_time = checked_out_time.expect("Unreachable");
      Ok(AlertMessage::simple(
        AlertLevel::P1,
        format!(
          "[{}] [{}::{}] [{}] the grandpa stopped {} seconds",
          input.chain,
          input.pallet_name,
          input.storage_name,
          input.endpoint,
          out_time.as_secs(),
        ),
      ))
    }
  }

  pub struct CheckDataInput {
    pub chain: String,
    pub pallet_name: String,
    pub endpoint: String,
    pub storage_name: String,
    pub storage_key: StorageKey,
    pub allow_time: Duration,
  }
}
