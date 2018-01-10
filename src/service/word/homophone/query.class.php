<?php
/**
 * query.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\service\word\homophone;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * The base class of all query (collection-based get) services
 */
class query extends \cenozo\service\query
{
  /**
   * Extends parent method
   */
  protected function get_record_count()
  {
    // get the first_word associated with the base word and return all records linked to it
    $db_word = $this->get_parent_record();
    $homophone_class_name = lib::get_class_name( 'database\homophone' );
    $db_homophone = $homophone_class_name::get_unique_record( 'word_id', $db_word->id );
    if( is_null( $db_homophone ) ) return 0;
    
    $modifier = clone $this->modifier;
    $this->select->apply_aliases_to_modifier( $modifier );

    $modifier->where( 'first_word_id', '=', $db_homophone->first_word_id );
    return $homophone_class_name::count( $modifier );
  }

  /**
   * Extends parent method
   */
  protected function get_record_list()
  {
    // get the first_word associated with the base word and return all records linked to it
    $db_word = $this->get_parent_record();
    $homophone_class_name = lib::get_class_name( 'database\homophone' );
    $db_homophone = $homophone_class_name::get_unique_record( 'word_id', $db_word->id );
    if( is_null( $db_homophone ) ) return array();
    
    $modifier = clone $this->modifier;
    $this->select->apply_aliases_to_modifier( $modifier );

    // restrict to the word's first-word list
    $modifier->where( 'first_word_id', '=', $db_homophone->first_word_id );
    return $homophone_class_name::select( $this->select, $modifier );
  }
}
