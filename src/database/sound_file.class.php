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
    $last_sync_file = $setting_manager->get_setting( 'general', 'last_sync_file' );
    $result = 0;

    // create a temporary table to put raw data into
    static::db()->execute(
      'CREATE TEMPORARY TABLE temp_sound_file ( '.
        'uid char(7) NOT NULL, '.
        'filename varchar(255) NOT NULL, '.
        'datetime DATETIME NOT NULL, '.
        'KEY dk_uid ( uid )'.
      ')' );

    // If the last sync file is present then only get files which were created after it was
    // Note: we're reverse-grepping for "-in." to ignore asterisk-recorded interviewer recordings
    $command = sprintf(
      'find -L %s -type f %s -printf "%s" | grep "/[A-Z][0-9]\\{6\\}/" | grep -v "\-in."',
      RECORDINGS_PATH,
      file_exists( $last_sync_file ) ? sprintf( '-newer %s', $last_sync_file ) : '',
      '%p\t%TY-%Tm-%Td %TT\n'
    );
    $file_list = array();
    exec( $command, $file_list );

    // organize files by participant
    $count = 0;
    $insert = '';
    foreach( $file_list as $row )
    {
      $parts = explode( "\t", $row );
      $datetime = preg_replace( '/\..*/', '', $parts[1] ); // remove the decimal seconds part of the date
      $file = $parts[0];
      $last_slash = strrpos( $file, '/' );
      $second_last_slash = strrpos( $file, '/', $last_slash - strlen( $file ) - 1 );
      $uid = substr( $file, $second_last_slash+1, $last_slash - $second_last_slash - 1 );
      $filename = str_replace( RECORDINGS_PATH.'/', '', $file );

      // divide inserting data into groups of 1000 records
      $count++;
      if( 1000 <= $count )
      {
        static::db()->execute(
          sprintf( 'INSERT INTO temp_sound_file( uid, filename, datetime ) VALUES %s', $insert ) );
        $count = 0;
        $insert = '';
      }
      else
      {
        $insert .= ( 1 < $count ? ',' : '' )
                  .sprintf( '( %s, %s, %s )',
                            static::db()->format_string( $uid ),
                            static::db()->format_string( $filename ),
                            static::db()->format_string( $datetime ) );
      }
    }

    if( 0 < $count )
    {
      static::db()->execute(
        sprintf( 'INSERT INTO temp_sound_file( uid, filename, datetime ) VALUES %s', $insert ) );

      // turn off unique and foreign key checks
      static::db()->execute( 'SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0' );
      static::db()->execute( 'SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0' );

      // now convert from temporary records into the sound_file table
      $result = static::db()->execute(
        'REPLACE INTO sound_file( participant_id, test_type_id, filename, datetime ) '.
        'SELECT participant.id, test_type.id, filename, datetime '.
        'FROM temp_sound_file '.
        'JOIN participant ON temp_sound_file.uid = participant.uid '.
        'LEFT JOIN test_type ON filename RLIKE ( '.
          'SELECT GROUP_CONCAT( format SEPARATOR "|" ) '.
          'FROM filename_format '.
          'WHERE test_type_id = test_type.id '.
        ')'
      );

      // turn unique and foreign key checks back on
      static::db()->execute( 'SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS' );
      static::db()->execute( 'SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS' );

      static::db()->execute( 'DROP TABLE temp_sound_file' );
    }

    // now update the sync file to track when the last sync was done
    if( !file_exists( $last_sync_file ) )
      file_put_contents(
        $last_sync_file,
        'This file is used to track which sound files have been read into the database, DO NOT REMOVE.' );

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
    $select->add_constant( 0 );
    $select->add_constant( 'UTC_TIMESTAMP()' );
    static::db()->execute( sprintf(
      'INSERT IGNORE INTO participant_sound_file_total( participant_id, total, datetime ) %s %s',
      $select->get_sql(),
      $modifier->get_sql()
    ) );
  }
}
