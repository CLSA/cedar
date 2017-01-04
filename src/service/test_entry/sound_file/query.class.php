<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\service\test_entry\sound_file;
use cenozo\lib, cenozo\log, cedar\util;

class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  public function get_leaf_parent_relationship()
  {
    $relationship_class_name = lib::get_class_name( 'database\relationship' );
    return $relationship_class_name::MANY_TO_MANY;
  }

  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    $sound_file_class_name = lib::get_class_name( 'database\sound_file' );
    $modifier = clone $this->modifier;
    $db_test_entry = $this->get_parent_record();

    // find aliases in the select and translate them in the modifier
    $this->select->apply_aliases_to_modifier( $modifier );

    // restrict to this participant's files
    $modifier->join( 'transcription', 'sound_file.participant_id', 'transcription.participant_id' );
    $modifier->where( 'transcription.id', '=', $db_test_entry->transcription_id );

    // include the test entry's test type, or NULL types (putting null types last)
    $modifier->where(
      sprintf( 'IFNULL( sound_file.test_type_id, %d )', $db_test_entry->test_type_id ),
      '=',
      $db_test_entry->test_type_id
    );

    return $sound_file_class_name::count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    $sound_file_class_name = lib::get_class_name( 'database\sound_file' );
    $modifier = clone $this->modifier;
    $db_test_entry = $this->get_parent_record();

    // find aliases in the select and translate them in the modifier
    $this->select->apply_aliases_to_modifier( $modifier );

    // restrict to this participant's files
    $modifier->join( 'transcription', 'sound_file.participant_id', 'transcription.participant_id' );
    $modifier->where( 'transcription.id', '=', $db_test_entry->transcription_id );

    // include the test entry's test type, or NULL types (putting null types last)
    $modifier->where(
      sprintf( 'IFNULL( sound_file.test_type_id, %d )', $db_test_entry->test_type_id ),
      '=',
      $db_test_entry->test_type_id
    );
    $modifier->order_desc( 'sound_file.test_type_id' );
    $modifier->order( 'sound_file.filename' );

    return $sound_file_class_name::select( $this->select, $modifier );
  }
}
