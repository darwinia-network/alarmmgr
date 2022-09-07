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

  use crate::client::Subclient;
  use crate::error::MonitorResult;
  use crate::rat::_helpers::check_out_time_range;
  use crate::storage;

  pub struct SubstrateLikeCheck {}

  impl SubstrateLikeCheck {
    /// check substrate chain storage not changed long time
    pub async fn check_storage_active(input: CheckDataInput) -> MonitorResult<CheckedActiveType> {
      let client = Subclient::new(&input.endpoint)?;
      let storage_result = client.storage_raw(input.storage_key).await?;
      if storage_result.is_none() {
        return Ok(CheckedActiveType::NoData);
      }

      // query last cached
      let storage_data = storage_result.expect("Unreachable");
      let last_cached = storage::last_range_data(&input.cache_name);
      if last_cached.is_none() {
        storage::store_last_range_data(input.cache_name, storage_data);
        return Ok(CheckedActiveType::Pass);
      }

      // check is it timeout
      let rs = last_cached.expect("Unreachable");
      let checked_out_time = check_out_time_range(storage_data, &rs, input.allow_time);
      if checked_out_time.is_none() {
        return Ok(CheckedActiveType::Pass);
      }

      let out_time = checked_out_time.expect("Unreachable");
      Ok(CheckedActiveType::Dead { out_time })
    }
  }

  pub struct CheckDataInput {
    pub cache_name: String,
    pub endpoint: String,
    pub storage_key: StorageKey,
    pub allow_time: Duration,
  }

  pub enum CheckedActiveType {
    Pass,
    NoData,
    Dead { out_time: Duration },
  }
}
