<?php
/**
 * test_entry_note.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry_note: record
 */
class test_entry_note extends \cenozo\database\record
{
  /**
   * Extend parent method
   */
  public function save()
  {
    // if the datetime isn't set then set it to the current date and time
    if( is_null( $this->datetime ) ) $this->datetime = util::get_datetime_object();

    parent::save();
  }
}
