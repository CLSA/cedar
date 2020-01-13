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
    parent::delete();

    // also update the base word's AFT and FAS status
    $this->get_word()->update_based_on_compound_words();
  }

  /**
   * Extend parent method
   */
  public function save()
  {
    parent::save();

    // Note: we only want to update the word if there are 2 or more compound words, otherwise the
    // word's AFT and FAS columns will be set when there is only 1 compound word resulting in the
    // word being uneditable by supervisors
    $db_word = $this->get_word();
    if( 1 < $db_word->get_compound_count() ) $db_word->update_based_on_compound_words();
  }

  /**
   * The type of record which the record has a rank for.
   * @var string
   * @access protected
   * @static
   */
  protected static $rank_parent = 'word';
}
