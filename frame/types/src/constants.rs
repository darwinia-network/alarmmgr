use std::path::{Path, PathBuf};

/// Get bridger home
pub fn app_home() -> PathBuf {
  let path_env = std::env::var("ALARMMGR_HOME");
  let is_from_env = path_env.is_ok();
  let basic_path = path_env
    .map(|v| Path::new(&v).join(""))
    .ok()
    .or_else(dirs::home_dir)
    .or_else(|| {
      std::env::current_exe()
        .map(|v| v.parent().map(|p| p.to_path_buf()))
        .ok()
        .flatten()
    })
    .unwrap_or_else(std::env::temp_dir);
  let mut base_path = basic_path;
  if !is_from_env {
    base_path = base_path.join(".alarmmgr");
  }
  base_path
}
