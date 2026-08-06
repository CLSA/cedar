<?php
/**
 * sound_file.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * sound_file: record
 */
class sound_file extends \cenozo\database\record
{
  /**
   * Adds any sound files found in the recordings path which are newer than the last time this method was called
   * 
   * @access public
   */
  public static function update_sound_file_list()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $setting_manager = lib::create( 'business\setting_manager' );
    // remove the start and end delimiters from the uid regex (^ and $)
    $uid_regex = preg_replace( '/(^\\^)|(\\$$)/', '', $setting_manager->get_setting( 'general', 'uid_regex' ) );
    $last_sync_file = $setting_manager->get_setting( 'general', 'last_sync_file' );
    $result = 0;

    // create a temporary table to put raw data into
    static::db()->execute(
      'CREATE TEMPORARY TABLE temp_sound_file ( '.
        'uid char(7) NOT NULL, '.
        'filename varchar(255) NOT NULL, '.
        'extension char(7) NOT NULL, '.
        'datetime DATETIME NOT NULL, '.
        'KEY dk_uid ( uid )'.
      ')'
    );

    // If the last sync file is present then only get files which were created after it was
    // Note: we're reverse-grepping for "-operator." to ignore asterisk-recorded interviewer recordings
    $command = sprintf(
      'find -L %s -type f %s -printf "%s" | grep "/%s/.*\.(ogg|wav)" | grep -v "\-operator."',
      RECORDINGS_PATH,
      file_exists( $last_sync_file ) ? sprintf( '-newer %s', $last_sync_file ) : '',
      '%p\t%TY-%Tm-%Td %TT\n',
      preg_replace( '/([{}])/', '\\\\$1', $uid_regex ) // backslashes before curly braces
    );
    $file_list = array();
    exec( $command, $file_list );

    // organize files by participant
    $insert_list = array();
    foreach( $file_list as $row )
    {
      $parts = explode( "\t", $row );
      preg_match( sprintf( '#.*/(%s)/([^/]+).(ogg|wav)#', $uid_regex ), $parts[0], $matches );
      $uid = $matches[1];
      $filename = $matches[2];
      $extension = $matches[3];
      $datetime = preg_replace( '/\..*/', '', $parts[1] ); // remove the decimal seconds part of the date

      $insert_list[] = sprintf(
        '( %s, %s, %s, %s )',
        static::db()->format_string( $uid ),
        static::db()->format_string( $filename ),
        static::db()->format_string( $extension ),
        static::db()->format_string( $datetime )
      );

      // divide inserting data into groups of 1000 records
      if( 1000 <= count( $insert_list ) )
      {
        static::db()->execute( sprintf(
          'INSERT INTO temp_sound_file( uid, filename, extension, datetime ) VALUES %s',
          implode( ',', $insert_list )
        ) );
        $insert_list = array();
      }
    }

    if( 0 < count( $insert_list ) )
    {
      static::db()->execute( sprintf(
        'INSERT INTO temp_sound_file( uid, filename, extension, datetime ) VALUES %s',
        implode( ',', $insert_list )
      ) );
    }

    // now convert from temporary records into the sound_file table
    $result = static::db()->execute(
      'REPLACE INTO sound_file( participant_id, test_type_id, filename, extension, datetime ) '.
      'SELECT participant.id, test_type.id, filename, extension, datetime '.
      'FROM temp_sound_file '.
      'JOIN participant ON temp_sound_file.uid = participant.uid '.
      'LEFT JOIN test_type ON filename RLIKE ( '.
        'SELECT GROUP_CONCAT( format SEPARATOR "|" ) '.
        'FROM filename_format '.
        'WHERE test_type_id = test_type.id '.
      ')'
    );

    static::db()->execute( 'DROP TABLE temp_sound_file' );

    // now update the sync file to track when the last sync was done
    if( !file_exists( $last_sync_file ) )
    {
      file_put_contents(
        $last_sync_file,
        'This file is used to track which sound files have been read into the database, DO NOT REMOVE.'
      );
    }

    touch( $last_sync_file );

    return $result;
  }

  /**
   * Forces a list of participants to be added to the sound_file table (with no recordings)
   * @param database\modifier $modifier
   * @access public
   * @static
   */
  public static function force_add_participant_list( $modifier )
  {
    $select = lib::create( 'database\select' );
    $select->from( 'participant' );
    $select->add_column( 'id' );
    $select->add_constant( 0, 'total' );
    $select->add_constant( 'UTC_TIMESTAMP()', 'datetime', 'datetime', false );
    static::db()->execute( sprintf(
      'INSERT IGNORE INTO participant_sound_file_total( participant_id, total, datetime ) %s %s',
      $select->get_sql(),
      $modifier->get_sql()
    ) );
  }
}
