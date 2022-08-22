use alarmmgr_monitor::AlarmmgrMonitor;
use crate::error::CliResult;
use crate::types::StartCommand;

pub fn exec_start(command: StartCommand) -> CliResult<()> {
  let config = command.try_into()?;
  let alarmmgr = AlarmmgrMonitor::new(config);
  alarmmgr.listen()?;
  Ok(())
}
