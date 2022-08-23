use crate::error::CliResult;
use crate::types::StartCommand;
use alarmmgr_monitor::AlarmmgrMonitor;

pub async fn exec_start(command: StartCommand) -> CliResult<()> {
  let config = command.try_into()?;
  let alarmmgr = AlarmmgrMonitor::new(config);
  alarmmgr.listen().await?;
  Ok(())
}
