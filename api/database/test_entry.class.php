<?php
/**
 * test_entry.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test_entry: record
 */
class test_entry extends \cenozo\database\has_note
{
  /**
   * Get the previous record according to test rank.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return database\test_entry (NULL if unsuccessful)
   * @access public
   */
  public function get_previous()
  {
    $db_prev_test_entry = NULL;
    if( is_null( $this->id ) )
    {
       throw lib::create( 'exception\runtime',
         'Tried to get previous test_entry on test_entry with no id', __METHOD__ );
    }
    else
    {
      $test_class_name = lib::get_class_name( 'database\test' );
      $rank = $this->get_test()->rank - 1;
      $found = false;
      do
      {
        $db_prev_test = $test_class_name::get_unique_record( 'rank', $rank-- );
        if( !is_null( $db_prev_test ) )
        {
          $db_test_entry = static::get_unique_record(
            array( 'test_id', 'assignment_id' ),
            array( $db_prev_test->id, $this->assignment_id ) );
          if( !is_null( $db_test_entry ) &&
              !in_array( $db_test_entry->audio_status, self::$audio_complete_states ) &&
              'refused' != $db_test_entry->participant_status &&
              'submitted' != $db_test_entry->completed )
          {
            $db_prev_test_entry = $db_test_entry;
            $found = true;
          }
        }
      } while( !$found && 0 < $rank );
    }
    return $db_prev_test_entry;
  }

  /**
   * Get the next record according to test rank.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return database\test_entry (NULL if unsuccessful)
   * @access public
   */
  public function get_next()
  {
    $db_next_test_entry = NULL;
    if( is_null( $this->id ) )
    {
     throw lib::create( 'exception\runtime',
       'Tried to get next test_entry on test_entry with no id', __METHOD__ );
    }
    else
    {
      $test_class_name = lib::get_class_name( 'database\test' );
      $rank = $this->get_test()->rank + 1;
      $max_rank = $test_class_name::count();
      $found = false;
      do
      {
        $db_next_test = $test_class_name::get_unique_record( 'rank', $rank++ );
        if( !is_null( $db_next_test ) )
        {
          $db_test_entry = static::get_unique_record(
            array( 'test_id', 'assignment_id' ),
            array( $db_next_test->id, $this->assignment_id ) );
          if( !is_null( $db_test_entry ) &&
              !in_array( $db_test_entry->audio_status, self::$audio_complete_states ) &&
              'refused' != $db_test_entry->participant_status &&
              'submitted' != $db_test_entry->completed )
          {
            $db_next_test_entry = $db_test_entry;
            $found = true;
          }
        }
      } while( !$found && $rank <= $max_rank );
    }
    return $db_next_test_entry;
  }

  /**
   * Determine the completed status of this test entry.
   * NOTE: completeness test must be implemented for each test type.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return bool completed status
   */
  public function is_completed()
  {
    $completed = false;

    // check if the participant refused the test or if
    // the audio was sufficiently faulty
    if( 'refused' == $this->participant_status ||
        in_array( $this->audio_status, self::$audio_complete_states ) )
    {
      $completed = true;
    }
    else
    {
      // what type of test is this ?
      $db_test = $this->get_test();
      $test_type_name = $db_test->get_test_type()->name;
      $entry_class_name = lib::get_class_name( 'database\test_entry_' . $test_type_name );

      // the test is different depending on type:
      // - confirmation: confirmation column is not null
      // - classification: one word_id column not null
      // - alpha_numeric: one word_id column not null
      // - ranked_word: all primary dictionary words have valid selection responses with
      // variant and intrusion responses having a not null word_id

      $base_mod = lib::create( 'database\modifier' );
      $base_mod->where( 'test_entry_id', '=', $this->id );
      if( 'confirmation' == $test_type_name )
      {
        $modifier = clone $base_mod;
        $modifier->where( 'confirmation', '!=', NULL );
        $completed = 0 < $entry_class_name::count( $modifier );
      }
      else if( 'classification' == $test_type_name || 'alpha_numeric' == $test_type_name )
      {
        $modifier = clone $base_mod;
        $modifier->where( 'word_id', '!=', NULL );
        $completed = 0 < $entry_class_name::count( $modifier );
      }
      else if( 'ranked_word' == $test_type_name )
      {
        // custom query for ranked_word test type
        $modifier = clone $base_mod;
        $modifier->where( 'ranked_word_set_id', '!=', NULL );
        $modifier->where( 'selection', '!=', NULL );
        $sql = sprintf(
          'SELECT '.
          '( '.
            '( SELECT MAX(rank) FROM ranked_word_set ) - '.
            '( '.
              'SELECT COUNT(*) FROM test_entry_ranked_word %s '.
              'AND IF( selection = "variant", IF( word_id IS NULL, 0, 1 ), 1 ) '.
            ') '.
          ')',
          $modifier->get_sql() );

        $completed = 0 === intval( static::db()->get_one( $sql ) );

        // check that intrusions are filled in
        if( $completed )
        {
          $modifier = clone $base_mod;
          $modifier->where( 'ranked_word_set_id', '=', NULL );
          $modifier->where( 'selection', '=', NULL );
          $modifier->where( 'word_id', '=', NULL );

          $completed = 0 === $entry_class_name::count( $modifier );
        }
      }
    }

    return $completed;
  }

  /**
   * Initialize this test_entry by deleting and recreating all daughter table entries.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param boolean reset_default Reset column values to their default state at creation.
   * @access public
   */
  public function initialize( $reset_default = true )
  {
    if( $reset_default )
    {
      $this->completed = 'incomplete';
      $this->deferred = NULL;
      $this->audio_status = NULL;
      $this->participant_status = NULL;
      $this->save();
    }

    $db_test = $this->get_test();
    $test_type_name = $db_test->get_test_type()->name;
    $entry_class_name = 'test_entry_' . $test_type_name;
    $get_count_method = 'get_' . $entry_class_name . '_count';

    if( 0 < $this->$get_count_method() )
    {
      $sql = sprintf(
        'DELETE FROM %s '.
        'WHERE test_entry_id = %s',
        $entry_class_name,
        static::db()->format_string( $this->id ) );
      static::db()->execute( $sql );
    }

    if( 'ranked_word' == $test_type_name )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->order( 'rank' );
      foreach( $db_test->get_ranked_word_set_list( $modifier ) as $db_ranked_word_set )
      {
        $db_test_entry_ranked_word = lib::create( 'database\\'. $entry_class_name );
        $db_test_entry_ranked_word->test_entry_id = $this->id;
        $db_test_entry_ranked_word->ranked_word_set_id = $db_ranked_word_set->id;
        $db_test_entry_ranked_word->save();
      }
    }
    else if( 'confirmation' == $test_type_name )
    {
      $db_test_entry_confirmation = lib::create( 'database\\'. $entry_class_name );
      $db_test_entry_confirmation->test_entry_id = $this->id;
      $db_test_entry_confirmation->save();
    }
    else if( 'classification' == $test_type_name )
    {
      $setting_manager = lib::create( 'business\setting_manager' );
      $max_rank = $setting_manager->get_setting( 'interface', 'classification_max_rank' );
      for( $rank = 1; $rank <= $max_rank; $rank++ )
      {
        $db_test_entry_classification = lib::create( 'database\\'. $entry_class_name );
        $db_test_entry_classification->test_entry_id = $this->id;
        $db_test_entry_classification->rank = $rank;
        $db_test_entry_classification->save();
      }
    }
    else if( 'alpha_numeric' == $test_type_name )
    {
      $setting_manager = lib::create( 'business\setting_manager' );
      $max_rank = $setting_manager->get_setting( 'interface', 'alpha_numeric_max_rank' );
      for( $rank = 1; $rank <= $max_rank; $rank++ )
      {
        $db_test_entry_alpha_numeric = lib::create( 'database\\'. $entry_class_name );
        $db_test_entry_alpha_numeric->test_entry_id = $this->id;
        $db_test_entry_alpha_numeric->rank = $rank;
        $db_test_entry_alpha_numeric->save();
      }
    }
  }

  /**
   * Trim off empty alpha_numeric, classification and ranked_word test
   * entries.  Trim removes entries starting from the highest id downward
   * until the first non-empty record is reached.  Trim will remove, for example,
   * trailing empty intrusion records in ranked_word tests.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return integer number of records deleted
   * @access public
   */
  public function trim()
  {
    $db_test = $this->get_test();
    $test_type_name = $db_test->get_test_type()->name;
    if( 'confirmation' == $test_type_name ) return 0;

    $entry_class_name = lib::get_class_name( 'database\test_entry_' . $test_type_name );

    $sql = NULL;
    if( 'classification' == $test_type_name || 'alpha_numeric' == $test_type_name )
    {
      $sql = sprintf(
        'SELECT id '.
        'FROM test_entry_' . $test_type_name . ' '.
        'WHERE word_id IS NULL '.
        'AND test_entry_id = %s '.
        'ORDER BY rank DESC',
        static::db()->format_string( $this->id ) );
    }
    else
    {
      $sql = sprintf(
        'SELECT id '.
        'FROM test_entry_' . $test_type_name . ' '.
        'WHERE word_id IS NULL '.
        'AND ranked_word_set_id IS NULL '.
        'AND test_entry_id = %s '.
        'ORDER BY id DESC',
        static::db()->format_string( $this->id ) );
    }
    $rows = $entry_class_name::db()->get_all( $sql );
    $count = 0;
    if( count( $rows ) > 0 )
    {
      foreach( $rows as $index => $row )
      {
        $db_entry = lib::create( 'database\test_entry_' . $test_type_name, $row['id'] );
        if( !is_null( $db_entry->word_id ) ) break;
        $db_entry->delete();
        $count++;
      }
    }
    return $count;
  }

  /**
   * Truncate alpha_numeric, classification and ranked_word test
   * entries.  Truncate removes entries starting from the highest id downward
   * until $size deletions are obtained.  For ranked_word entries, only
   * intrusions can be deleted.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return integer number of records deleted
   * @access public
   */
  public function truncate( $size = 0 )
  {
    if( 0 == $size ) return 0;

    $db_test = $this->get_test();
    $test_type_name = $db_test->get_test_type()->name;
    if( 'confirmation' == $test_type_name ) return 0;

    $entry_class_name = lib::get_class_name( 'database\test_entry_' . $test_type_name );

    $sql = sprintf(
      'SELECT id '.
      'FROM test_entry_' . $test_type_name . ' '.
      'WHERE test_entry_id = %s '.
      'ORDER BY id DESC '.
      'LIMIT %d',
      static::db()->format_string( $this->id ), $size );

    $rows = $entry_class_name::db()->get_all( $sql );
    $count = 0;
    if( count( $rows ) > 0 )
    {
      foreach( $rows as $index => $row )
      {
        $db_entry = lib::create( 'database\test_entry_' . $test_type_name, $row['id'] );
        if( 'ranked_word' == $test_type_name &&
            !is_null( $db_entry->ranked_word_set_id ) ) break;
        $db_entry->delete();
        $count++;
      }
    }
    return $count;
  }

  /**
   * Get the id of the participant's preferred language or that of the
   * service to use for transcribing audio recordings.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @return $db_language default language to transcribe in
   * @access public
   */
  public function get_default_participant_language()
  {
    $db_participant = is_null( $this->assignment_id ) ?
      $this->get_participant() : $this->get_assignment()->get_participant();
    return is_null( $db_participant->language_id ) ?
      lib::create( 'business\session' )->get_service()->get_language() :
      $db_participant->get_language();
  }

  /**
   * Audio states that allow completion without daughter entry items.
   * @var audio_complete_states
   * @access private
   */
  public static $audio_complete_states = array( 'unavailable', 'unusable' );

  /**
   * Deferral states that indicate a deferred status.
   * @var audio_complete_states
   * @access private
   */
  public static $deferred_states = array( 'requested', 'pending' );
}
