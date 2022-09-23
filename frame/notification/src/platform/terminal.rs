use chrono;
use chrono::Utc;
use colored::Colorize;
use term_table::row::Row;
use term_table::table_cell::{Alignment, TableCell};
use term_table::{Table, TableStyle};

use crate::error::NotificationResult;
use crate::traits::AlarmmgrNotification;
use crate::types::NotifyMessage;

#[derive(Clone)]
pub struct TerminalNotification;

#[async_trait::async_trait]
impl AlarmmgrNotification for TerminalNotification {
  fn name(&self) -> String {
    "terminal".to_string()
  }

  async fn notify(&self, message: NotifyMessage) -> NotificationResult<()> {
    let mut table = Table::new();
    table.max_column_width = 40;
    table.style = TableStyle::extended();

    let level = message.level.map(|item| item.view()).unwrap_or_default();

    let time = Utc::now();
    let formatted_date = time.format("%Y-%m-%d %H:%M:%S");
    table.add_row(Row::new(vec![TableCell::new_with_alignment(
      format!("[{}] {}", level.red(), formatted_date),
      4,
      Alignment::Left,
    )]));
    table.add_row(Row::new(vec![TableCell::new_with_alignment(
      message.title,
      4,
      Alignment::Left,
    )]));
    table.add_row(Row::new(vec![TableCell::new_with_alignment(
      message.body,
      4,
      Alignment::Left,
    )]));
    println!("{}", table.render());
    Ok(())
  }
}
