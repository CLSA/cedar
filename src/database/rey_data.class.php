<?php
/**
 * rey_data.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * rey_data: record
 */
class rey_data extends base_data
{
  /**
   * Extends parent method
   */
  public function __set( $column_name, $value )
  {
    // Every word in the REY test must either have a yes/no value or a variant, but not both, so
    // if we are setting a word's value or variant to something non-null then set the other to null
    if( !is_null( $value ) )
    {
      $pos = strpos( $column_name, '_rey_data_variant_id' );
      $other_column_name = false !== $pos
                         ? substr( $column_name, 0, $pos )
                         : $column_name.'_rey_data_variant_id';
      if( $this->column_exists( $other_column_name ) ) parent::__set( $other_column_name, NULL );
    }

    parent::__set( $column_name, $value );
  }

  /**
   * Override parent method
   */
  public static function initialize( $db_test_entry )
  {
    // save the language if we already have one
    $language_id = NULL;
    $db_rey_data = static::get_unique_record( 'test_entry_id', $db_test_entry->id );
    if( !is_null( $db_rey_data ) ) $language_id = $db_rey_data->language_id;

    parent::initialize( $db_test_entry );

    // create a rey_data record for the test entry
    $db_rey_data = new static();
    $db_rey_data->test_entry_id = $db_test_entry->id;
    $db_rey_data->language_id = is_null( $language_id )
                              ? $db_test_entry->get_transcription()->get_participant()->language_id
                              : $language_id;
    $db_rey_data->save();
  }

  /**
   * Replace all uses of an associated word with another
   * 
   * This is used when correcting spelling errors
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param database\word $db_old_word
   * @param database\word $db_new_word
   * @access public
   * @static
   */
  public static function substitute_word( $db_old_word, $db_new_word )
  {
    // find all data that needs to be deleted to prevent duplicates
    $sql = sprintf(
      'CREATE TEMPORARY TABLE remove_rey_data_has_word'."\n".
      'SELECT rey_data_id, %s AS word_id'."\n".
      'FROM rey_data_has_word'."\n".
      'WHERE word_id IN ( %s, %s )'."\n".
      'GROUP BY rey_data_id'."\n".
      'HAVING COUNT(*) > 1',
      static::db()->format_string( $db_old_word->id ),
      static::db()->format_string( $db_old_word->id ),
      static::db()->format_string( $db_new_word->id )
    );
    static::db()->execute( $sql );

    $sql = 'ALTER TABLE remove_rey_data_has_word ADD PRIMARY KEY( rey_data_id, word_id )';
    static::db()->execute( $sql );

    $sql =
      'DELETE FROM rey_data_has_word'."\n".
      'WHERE( rey_data_id, word_id ) IN ('."\n".
      '  SELECT * FROM remove_rey_data_has_word'."\n".
      ')';
    static::db()->execute( $sql );

    // now replace all remaining old words
    $sql = sprintf(
      'UPDATE rey_data_has_word SET word_id = %s WHERE word_id = %s',
      $db_new_word->id,
      $db_old_word->id
    );
    static::db()->execute( $sql );
  }

  /**
   * Returns whether or not any of the variant words use a particular language
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @param int|array(int) $language_id
   * @return boolean
   * @access public
   */
  public function has_variant_language( $language )
  {
    $language = static::db()->format_string( is_array( $language ) ? implode( ',', $language ) : $language );
    $sql = sprintf(
      'SELECT '."\n".
        'IFNULL( FIND_IN_SET( drum_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( curtain_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( bell_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( coffee_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( school_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( parent_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( moon_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( garden_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( hat_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( farmer_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( nose_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( turkey_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( colour_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( house_variant.language_id, %s ), 0 ) OR'."\n".
        'IFNULL( FIND_IN_SET( river_variant.language_id, %s ), 0 ) AS has_language'."\n".
      'FROM rey_data'."\n".
      'LEFT JOIN rey_data_variant AS drum_variant ON drum_rey_data_variant_id = drum_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS curtain_variant ON curtain_rey_data_variant_id = curtain_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS bell_variant ON bell_rey_data_variant_id = bell_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS coffee_variant ON coffee_rey_data_variant_id = coffee_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS school_variant ON school_rey_data_variant_id = school_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS parent_variant ON parent_rey_data_variant_id = parent_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS moon_variant ON moon_rey_data_variant_id = moon_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS garden_variant ON garden_rey_data_variant_id = garden_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS hat_variant ON hat_rey_data_variant_id = hat_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS farmer_variant ON farmer_rey_data_variant_id = farmer_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS nose_variant ON nose_rey_data_variant_id = nose_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS turkey_variant ON turkey_rey_data_variant_id = turkey_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS colour_variant ON colour_rey_data_variant_id = colour_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS house_variant ON house_rey_data_variant_id = house_variant.id'."\n".
      'LEFT JOIN rey_data_variant AS river_variant ON river_rey_data_variant_id = river_variant.id'."\n".
      'WHERE rey_data.id = %s',
      $language, $language, $language, $language, $language, $language, $language, $language,
      $language, $language, $language, $language, $language, $language, $language,
      static::db()->format_string( $this->id )
    );

    return 1 == static::db()->get_one( $sql );
  }
}
