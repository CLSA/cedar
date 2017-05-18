<?php
/**
 * productivity.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 * @filesource
 */

namespace cedar\business\report;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Call history report
 */
class productivity extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @author Patrick Emond <emondpd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $participant_class_name = lib::get_class_name( 'database\participant' );
    $test_type_class_name = lib::get_class_name( 'database\test_type' );
    $transcription_class_name = lib::get_class_name( 'database\transcription' );
    $test_entry_activity_class_name = lib::get_class_name( 'database\test_entry_activity' );

    // create a list of all test types
    $test_type_mod = lib::create( 'database\modifier' );
    $test_type_mod->order( 'test_type.rank' );
    $test_type_list = array();
    foreach( $test_type_class_name::select_objects( $test_type_mod ) as $db_test_type )
      $test_type_list[] = $db_test_type;

    $select = lib::create( 'database\select' );
    $select->from( 'transcription' );
    $select->add_column( 'id' );
    $select->add_table_column( 'user', 'name', 'user' );
    $select->add_table_column( 'test_type', 'name', 'type' );
    $select->add_column(
      'SUM( TIMESTAMPDIFF( SECOND, test_entry_activity.start_datetime, test_entry_activity.end_datetime ) )',
      'time',
      false
    );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'test_entry', 'transcription.id', 'test_entry.transcription_id' );
    $modifier->join( 'test_type', 'test_entry.test_type_id', 'test_type.id' );
    $modifier->join( 'test_entry_activity', 'test_entry.id', 'test_entry_activity.test_entry_id' );
    $modifier->join( 'user', 'test_entry_activity.user_id', 'user.id' );
    $modifier->where( 'test_entry.state', '!=', 'assigned' );
    $modifier->group( 'transcription.id' );
    $modifier->group( 'user.name' );
    $modifier->group( 'test_type.name' );
    $modifier->set_rollup( true );

    $start_date = NULL;
    $end_date = NULL;
    $restrict_site_id = NULL;
    foreach( $this->get_restriction_list() as $restriction )
    {
      if( 'date' == $restriction['restriction_type'] )
      {
        $date = preg_replace( '/T.*/', '', $restriction['value'] );

        // keep track of the start/end date in case they match
        if( 'start_date' == $restriction['name'] ) $start_date = $date;
        else $end_date = $date;

        $modifier->where(
          sprintf( 'DATE( CONVERT_TZ( transcription.start_datetime, "UTC", "%s" ) )', $this->db_user->timezone ),
          'start_date' == $restriction['name'] ? '>=' : '<=',
          $date
        );
      }
      else if( 'site' == $restriction['name'] )
      {
        $restrict_site_id = $restriction['value'];
      }
    }

    // set up restrictions
    $this->apply_restrictions( $modifier );

    $site_sel = lib::create( 'database\select' );
    $site_sel->add_column( 'id' );
    $site_sel->add_column( 'name' );
    $site_mod = lib::create( 'database\modifier' );
    if( !is_null( $restrict_site_id ) ) $site_mod->where( 'site.id', '=', $restrict_site_id );
    $site_mod->order( 'site.name' );

    foreach( $this->db_application->get_site_list( $site_sel, $site_mod ) as $site )
    {
      // (key=>val) is (transcription id => user who spent the most overall time on the transcription)
      $transcription_list = array();
      // (key=>val) is (user name => array( test type => time spent )) and also includes total time and completes
      $user_list = array();

      $transcription_mod = clone $modifier;
      $transcription_mod->where( 'transcription.site_id', '=', $site['id'] );
      foreach( $transcription_class_name::select( $select, $transcription_mod ) as $row )
      {
        // ignore when the user row is null (this is the total time all users spent on one transcription (unneeded)
        if( !is_null( $row['user'] ) )
        {
          // create the transcription's entry if it doesn't exist yet
          if( !array_key_exists( $row['id'], $transcription_list ) ) $transcription_list[$row['id']] = array();

          // create the user's entry if it doesn't exist yet
          if( !array_key_exists( $row['user'], $user_list ) )
          {
            $user_list[$row['user']] = array();
            foreach( $test_type_list as $db_test_type ) $user_list[$row['user']][$db_test_type->name] = 0;
            $user_list[$row['user']]['Total Time'] = 0;
            $user_list[$row['user']]['Completed Transcriptions'] = 0;
          }

          if( is_null( $row['type'] ) )
          {
            // store how long this user spent on the transcription
            $transcription_list[$row['id']][$row['user']] = $row['time'];
            // add to the user's total time for all test types
            $user_list[$row['user']]['Total Time'] += $row['time'];
          }
          // add to the user's total time for this test type
          else $user_list[$row['user']][$row['type']] += $row['time'];
        }
      }

      // now go through the transcription list and award completes based on who spent the most time
      foreach( $transcription_list as $possible_user_list )
      {
        $award_user = NULL;
        $max = -1;
        foreach( $possible_user_list as $user => $time ) if( $time > $max ) $award_user = $user;
        if( !is_null( $award_user ) ) $user_list[$award_user]['Completed Transcriptions']++;
      }

      // remove any users with no completes and no time and calculate completes per hour
      foreach( $user_list as $user => $user_data )
      {
        $sum = 0;
        foreach( $user_data as $total ) $sum += $total;
        if( 0 == $sum ) unset( $user_list[$user] );
        else
        {
          // total time is currently in seconds, so convert to hours
          $user_list[$user]['Completes/Hour'] = 0 == $user_list[$user]['Total Time'] ?
            'n/a' : sprintf( '%0.2f', $user_list[$user]['Completed Transcriptions'] /
                                      ( $user_list[$user]['Total Time'] / 3600 ) );
        }
      }

      // calculate the completes per hour
      // create a table from this site's data
      $header = array_keys( $user_list );
      array_unshift( $header, 'overall' );
      array_unshift( $header, '' );
      $contents = array();

      // first column has headings
      foreach( $test_type_list as $db_test_type )
      {
        $key = $db_test_type->name;
        $contents[$key] = array( $key );
      }
      $contents['Total Time'] = array( 'Total Time' );
      $contents['Completed Transcriptions'] = array( 'Completed Transcriptions' );
      $contents['Completes/Hour'] = array( 'Completes/Hour' );

      // second column is overall data
      $overall = array();
      foreach( $test_type_list as $db_test_type ) $overall[$db_test_type->name] = 0;
      $overall['Total Time'] = 0;
      $overall['Completed Transcriptions'] = 0;
      $overall['Completes/Hour'] = '';

      foreach( $user_list as $user_data ) foreach( $user_data as $key => $value ) $overall[$key] += $value;
      $overall['Completes/Hour'] = 0 == $overall['Total Time'] ?
        'n/a' : sprintf( '%0.2f', $overall['Completed Transcriptions'] /
                                  ( $overall['Total Time'] / 3600 ) );
      foreach( $overall as $key => $value )
      {
        // convert seconds to minutes
        if( !in_array( $key, array( 'Completed Transcriptions', 'Completes/Hour' ) ) ) $value /= 60;
        // round floating point values
        if( 'Completed Transcriptions' != $key ) $value = sprintf( '%0.2f', $value );
        $contents[$key][] = $value;
      }

      foreach( $user_list as $user => $user_data )
      {
        foreach( $user_data as $key => $value )
        {
          // convert seconds to minutes
          if( !in_array( $key, array( 'Completed Transcriptions', 'Completes/Hour' ) ) ) $value /= 60;
          // round floating point values
          if( 'Completed Transcriptions' != $key ) $value = sprintf( '%0.2f', $value );
          $contents[$key][] = $value;
        }
      }
      $this->add_table( $site['name'], $header, $contents );
    }
  }
}
