<?php
/**
 * compound.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * compound: record
 */
class compound extends \cenozo\database\has_rank
{
  /**
   * Extend parent method
   */
  public function delete()
  {
    $db_word = $this->get_word();

    parent::delete();

    // also update the base word's AFT and FAS status
    $db_word->update_based_on_compound_words();
  }

  /**
   * Extend parent method
   */
  public function save()
  {
    parent::save();

    // also update the base word's AFT and FAS status
    $this->get_word()->update_based_on_compound_words();
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'word';
}
