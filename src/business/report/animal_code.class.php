<?php
/**
 * animal_code.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\business\report;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Call history report
 */
class animal_code extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @access protected
   */
  protected function build()
  {
    $word_class_name = lib::get_class_name( 'database\word' );

    $select = lib::create( 'database\select' );
    $select->from( 'word' );
    $select->add_column( 'animal_code' );
    $select->add_column( 'GROUP_CONCAT( CONCAT_WS( ",", word, language.code ) ORDER BY word )', 'words', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'word.animal_code', '!=', NULL );
    $modifier->join( 'language', 'word.language_id', 'language.id' );
    $modifier->group( 'word.animal_code' );
    $modifier->order( 'word.animal_code' );

    $header = array( 'Animal Code' );
    for( $i = 1; $i <= 50; $i++ )
    {
      $header[] = sprintf( 'Word %d', $i );
      $header[] = sprintf( 'Lang %d', $i );
    }

    $contents = array();

    foreach( $word_class_name::select( $select, $modifier ) as $row )
    {
      // split the words by comma
      $words = explode( ',', $row['words'] );
      array_unshift( $words, $row['animal_code'] );
      $contents[] = $words;
    }

    $this->add_table( NULL, $header, $contents );
  }
}
