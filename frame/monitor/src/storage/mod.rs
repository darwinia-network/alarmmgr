pub use self::range_storage::*;

mod range_storage {
  use std::{collections::HashMap, sync::Mutex};

  use alarmmgr_toolkit::timek;
  use once_cell::sync::Lazy;

  static RANGE_STORAGE: Lazy<Mutex<HashMap<String, RangeStorage>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

  #[derive(Clone, Debug)]
  pub struct RangeStorage {
    pub last: String,
    pub time: u128,
  }

  pub fn store_last_range_data(name: impl AsRef<str>, data: String) {
    let mut storage = RANGE_STORAGE.lock().expect("Unreachable");
    let rs = RangeStorage {
      last: data,
      time: timek::timestamp(),
    };
    storage.insert(name.as_ref().to_string(), rs);
  }

  pub fn last_range_data(name: impl AsRef<str>) -> Option<RangeStorage> {
    let storage = RANGE_STORAGE.lock().expect("Unreachable");
    storage.get(name.as_ref()).cloned()
  }
}
