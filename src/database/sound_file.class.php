<?php
/**
 * sound_file.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
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
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access public
   */
  public static function update_sound_file_list()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $last_sync_file = $setting_manager->get_setting( 'general', 'last_sync_file' );

    // create a temporary table to put raw data into
    static::db()->execute(
      'CREATE TEMPORARY TABLE temp_sound_file ( '.
        'uid char(7) NOT NULL, '.
        'name varchar(100) NULL DEFAULT NULL, '.
        'filename varchar(100) NOT NULL, '.
        'KEY dk_uid ( uid ), '.
        'KEY dk_name ( name ) '.
      ')' );

    // If the last sync file is present then only get files which were created after it was
    // Note: we're reverse-grepping for "-in." to ignore asterisk-recorded interviewer recordings
    $command = sprintf(
      'find -L %s -type f -printf "%p\t%TY-%Tm-%Td %TT\n" %s | grep -v "\-in."',
      RECORDINGS_PATH,
      file_exists( $last_sync_file ) ? sprintf( '-newer %s', $last_sync_file ) : ''
    )
    $file_list = array();
    exec( $command, $file_list );

    // organize files by participant
    $count = 0;
    $insert = '';
    foreach( $file_list as $row )
    {
      $parts = explode( "\t", $row );
      $file = $parts[0];
      $date = $parts[1];
      $last_slash = strrpos( $file, '/' );
      $second_last_slash = strrpos( $file, '/', $last_slash - strlen( $file ) - 1 );
      $uid = substr( $file, $second_last_slash+1, $last_slash - $second_last_slash - 1 );
      $filename = substr( $file, $last_slash+1 );

      // divide inserting data into groups of 1000 records
      $count++;
      if( 1000 <= $count )
      {
        static::db()->execute(
          sprintf( 'INSERT INTO temp_sound_file( uid, name, filename ) VALUES %s', $insert ) );
        $count = 0;
        $insert = '';
      }
      else
      {
        $name = false === strpos( $filename, '-out.wav' )
              ? substr( $filename, 0, strrpos( $filename, '.' ) )
              : NULL;
        $insert .= ( 1 < $count ? ',' : '' )
                  .sprintf( '( %s, %s, %s )',
                            static::db()->format_string( $uid ),
                            static::db()->format_string( $name ),
                            static::db()->format_string( $filename ) );
      }
    }

    if( 0 < $count )
    {
      static::db()->execute(
        sprintf( 'INSERT INTO temp_sound_file( uid, name, filename ) VALUES %s', $insert ) );
    }

    // now convert from temporary records into the sound_file table
    static::db()->execute(
      'REPLACE INTO sound_file( participant_id, sound_file_type_id, filename ) '.
      'SELECT participant.id, NULL, filename '.
      'FROM temp_sound_file '.
      'JOIN participant ON temp_sound_file.uid = participant.uid'
    );
    static::db()->execute( 'DROP TABLE temp_sound_file' );

    // now update the sync file to track when the last sync was done
    if( !file_exists( $last_sync_file ) )
      file_put_contents(
        $last_sync_file,
        'This file is used to track which sound files have been read into the database, DO NOT REMOVE.' );

    touch( $last_sync_file );
  }
}
