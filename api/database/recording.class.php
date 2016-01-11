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
    $padded_visit = str_pad( $this->visit, 3, '0', STR_PAD_LEFT );
    $filename = sprintf( '%s/%s/%s.wav',
                         $padded_visit,
                         $this->get_participant()->uid,
                         $this->get_test()->recording_name );

    return $filename;
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

    // make sure that all recordings on disk have a corresponding database record
    if( is_dir( RECORDINGS_PATH ) )
    {
      $glob_search = sprintf( '%s/*/*/*/*.wav', RECORDINGS_PATH );

      $values = '';
      $values_array = array();
      $first = true;
      $values_count = 0;
      $values_limit = 200;

      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'recording_name', '!=', NULL );
      $db_test_list = $test_class_name::select( $modifier );
      $recording_names = array();
      foreach( $db_test_list as $db_test )
      {
        $recording_names[$db_test->recording_name] = $db_test->id;
      }

      $glob_result = glob( $glob_search );

      foreach( $glob_result as $filename )
      {
        // get the path components from the filename
        $parts = array_reverse( preg_split( '#/#', $filename ) );
        if( 3 <= count( $parts ) )
        {
          $name = trim( str_replace( '.wav', '', $parts[0] ) );
          if( !array_key_exists( $name, $recording_names ) ) continue;
          $uid = trim( $parts[1] );
          $visit = intval( ltrim( $parts[2], '0' ) );

          $modifier = lib::create( 'database\modifier' );
          $modifier->where( 'uid', '=', $uid );
          $modifier->limit( 1 );
          $db_participant = current( $participant_class_name::select( $modifier ) );
          if( false !== $db_participant )
          {
            $values .= sprintf( '%s( %d, %d, %d )',
                                $first ? '' : ', ',
                                $db_participant->id,
                                $recording_names[$name],
                                $visit );
            $first = false;
            $values_count++;
            if( $values_count++ >= $values_limit )
            {
              $values_array[] = $values;
              $values_count = 0;
              $first = true;
              $values = '';
            }
          }
        }
      }

      if( $values_count < $values_limit && '' !== $values )
        $values_array[] = $values;

      foreach( $values_array as $values )
      {
        static::db()->execute( sprintf(
          'INSERT IGNORE INTO recording ( participant_id, test_id, visit ) '.
          'VALUES %s', $values ) );
      }
    }
  }
}
