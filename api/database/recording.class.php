<?php
/**
 * recording.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * recording: record
 */
class recording extends \cenozo\database\record
{
  /**
   * Gets the file associated with this recording
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return string
   * @access public
   */
  public function get_filename()
  {
    return sprintf( '%s/%s', $this->get_participant()->uid, $this->filename );
  }

  /**
   * Builds the recording list based on recording files found in the RECORDING path (if set)
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public static function update_recording_list()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $test_class_name = lib::get_class_name( 'database\test' );
    $setting_manager = lib::create( 'business\setting_manager' );
    $last_sync_file = $setting_manager->get_setting( 'general', 'last_sync_file' );

    // create a temporary table to put raw data into
    static::db()->execute(
      'CREATE TEMPORARY TABLE temp_recording ( '.
        'uid char(7) NOT NULL, '.
        'name varchar(100) NULL DEFAULT NULL, '.
        'filename varchar(100) NOT NULL, '.
        'KEY dk_uid ( uid ), '.
        'KEY dk_name ( name ) '.
      ')' );

    // If the last sync file is present then only get files which were created after it was
    // Note: we're reverse-grepping for "-in." to ignore asterisk-recorded interviewer recordings
    $command = file_exists( $last_sync_file )
             ? sprintf( 'find -L %s -type f -newer %s | grep -v "\-in."', RECORDINGS_PATH, $last_sync_file )
             : sprintf( 'find -L %s -type f | grep -v "\-in."', RECORDINGS_PATH );
    $file_list = array();
    exec( $command, $file_list );
    
    // organize files by participant
    $count = 0;
    $insert = '';
    foreach( $file_list as $file )
    {
      $last_slash = strrpos( $file, '/' );
      $second_last_slash = strrpos( $file, '/', $last_slash - strlen( $file ) - 1 );
      $uid = substr( $file, $second_last_slash+1, $last_slash - $second_last_slash - 1 );
      $filename = substr( $file, $last_slash+1 );

      // divide inserting data into groups of 1000 records
      $count++;
      if( 1000 <= $count )
      {
        static::db()->execute(
          sprintf( 'INSERT INTO temp_recording( uid, name, filename ) VALUES %s', $insert ) );
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
        sprintf( 'INSERT INTO temp_recording( uid, name, filename ) VALUES %s', $insert ) );
    }

    // now convert from temporary records into the recording table
    static::db()->execute(
      'INSERT IGNORE INTO recording( participant_id, test_id, filename ) '.
      'SELECT participant.id, test.id, filename '.
      'FROM temp_recording '.
      'JOIN participant ON temp_recording.uid = participant.uid '.
      'LEFT JOIN test ON temp_recording.name = test.recording_name' );

    static::db()->execute( 'DROP TABLE temp_recording' );

    // now update the sync file to track when the last sync was done
    if( !file_exists( $last_sync_file ) )
      file_put_contents(
        $last_sync_file,
        'This file is used to track which recordings have been read into the database, DO NOT REMOVE.' );

    touch( $last_sync_file );
  }
}
