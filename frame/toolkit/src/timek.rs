use std::time::{Duration, SystemTime, UNIX_EPOCH};

pub fn timestamp() -> u128 {
  let start = SystemTime::now();
  let since_the_epoch = start
    .duration_since(UNIX_EPOCH)
    .expect("Time went backwards");
  since_the_epoch.as_millis()
}


pub fn time_range_with_now(before: u128) -> Duration {
  let now = timestamp();
  let range_ms = now - before;
  let range = range_ms / 1000;
  Duration::from_secs(range as u64)
}
