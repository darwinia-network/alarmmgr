use crate::error::NotificationResult;
use crate::types::NotifyMessage;

/// alarmmgr notification
#[async_trait::async_trait]
pub trait AlarmmgrNotification {
  
  /// notification name
  fn name(&self) -> String;
  
  /// send notify message
  async fn notify(&self, message: NotifyMessage) -> NotificationResult<()>;
}
