<?php
/**
 * test_entry_transcribe.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\widget;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * widget test_entry transcribe
 */
class test_entry_transcribe extends \cenozo\ui\widget\base_record
{
  /**
   * Constructor.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry', 'transcribe', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function prepare()
  {
    parent::prepare();

    $test_class_name = lib::get_class_name('database\test');

    $db_test_entry = $this->get_record();
    $db_test = $db_test_entry->get_test();
    $db_participant = $db_test_entry->get_assignment()->get_participant();

    // create the test_entry sub widget
    // example: widget class test_entry_ranked_word_transcribe
    $this->test_entry_widget = lib::create(
      'ui\widget\test_entry_' . $db_test->get_test_type()->name . '_transcribe', $this->arguments );
    $this->test_entry_widget->set_parent( $this );
    $this->test_entry_widget->set_validate_access( $this->editable  );

    $modifier = NULL;
    if( $db_participant->get_cohort()->name == 'tracking' )
    {
      $modifier = lib::create('database\modifier');
      $modifier->where( 'name', 'NOT LIKE', 'FAS%' );
    }

    $test_count = $test_class_name::count( $modifier );

    $heading = sprintf( 'test %d / %d for %s',
      $db_test->rank, $test_count, $db_participant->uid );
    $this->set_heading( $heading );
  }

  /**
   * Validate the operation.  If validation fails this method will throw a notice exception.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\notice
   * @access protected
   */
  protected function validate()
  {
    parent::validate();

    $db_test_entry = $this->get_record();
    $test_type_name = $db_test_entry->get_test()->get_test_type()->name;
    $id_list = $db_test_entry->get_language_idlist();

    $session = lib::create( 'business\session' );
    $db_role = $session->get_role();
    if( 'typist' == $db_role->name )
    {
      if( 1 < count( $id_list ) && 'classification' != $test_type_name )
        throw lib::create( 'exception\notice',
          'This test can only have one language', __METHOD__ );
    }
  }

  /**
   * Sets up the operation with any pre-execution instructions that may be necessary.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $db_test_entry = $this->get_record();
    $db_test = $db_test_entry->get_test();
    $test_type_name = $db_test->get_test_type()->name;

    $audio_status_list = $test_entry_class_name::get_enum_values( 'audio_status' );
    $audio_status_list = array_combine( $audio_status_list, $audio_status_list );
    $audio_status_list = array_reverse( $audio_status_list, true );
    $audio_status_list['NULL'] = '';
    $audio_status_list = array_reverse( $audio_status_list, true );
    $audio_status = array_search( $db_test_entry->audio_status, $audio_status_list );

    $this->set_variable( 'audio_status', $audio_status );
    $this->set_variable(  'audio_status_list', $audio_status_list );

    $participant_status_list = $test_entry_class_name::get_enum_values( 'participant_status' );
    $participant_status_list = array_combine( $participant_status_list, $participant_status_list );
    $participant_status_list = array_reverse( $participant_status_list, true );
    $participant_status_list['NULL'] = '';
    $participant_status_list = array_reverse( $participant_status_list, true );

    $test_type_name = $db_test->get_test_type()->name;

    // classification tests (FAS and AFT) require suspected prompt and prompt status
    if( 'classification' != $test_type_name )
    {
      unset( $participant_status_list['suspected prompt'],
             $participant_status_list['prompted'] );
    }

    // ranked_word tests required prompt middle and prompt end status
    if( 'ranked_word' != $test_type_name )
    {
      unset( $participant_status_list['prompt middle'],
             $participant_status_list['prompt end'] );
    }

    $participant_status =
      array_search( $db_test_entry->participant_status, $participant_status_list );
    $this->set_variable( 'participant_status', $participant_status );
    $this->set_variable( 'participant_status_list', $participant_status_list );

    $this->set_variable( 'deferred',
      is_null( $db_test_entry->deferred ) ? 'null' : $db_test_entry->deferred );
    $this->set_variable( 'completed', $db_test_entry->completed );
    $this->set_variable( 'rank', $db_test->rank );
    $this->set_variable( 'test_type', $test_type_name );
    $this->set_variable( 'test_id', $db_test->id );

    // set the dictionary id's needed for text autocomplete
    if( 'classification' == $test_type_name || 'ranked_word' == $test_type_name )
    {
      $db_dictionary = $db_test->get_dictionary();
      if( !is_null( $db_dictionary ) )
        $this->set_variable( 'dictionary_id', $db_dictionary->id );

      $db_variant_dictionary = $db_test->get_variant_dictionary();
      if( !is_null( $db_variant_dictionary ) )
        $this->set_variable( 'variant_dictionary_id', $db_variant_dictionary->id );

      $db_intrusion_dictionary = $db_test->get_intrusion_dictionary();
      if( !is_null( $db_intrusion_dictionary ) )
        $this->set_variable( 'intrusion_dictionary_id', $db_intrusion_dictionary->id );
    }

    $db_assignment = $db_test_entry->get_assignment();
    $db_participant = $db_assignment->get_participant();

    $recording_class_name = lib::get_class_name( 'database\recording' );
    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'participant_id', '=', $db_participant->id );
    $modifier->where( 'test_id', '=', $db_test->id );
    $modifier->where( 'visit', '=', 1 );
    $modifier->limit( 1 );
    $db_recording = current( $recording_class_name::select( $modifier ) );
    $url = sprintf( '%s/%s/%s',
                    RECORDINGS_URL,
                    $db_participant->get_cohort()->name,
                    $db_recording->get_filename() );
    $recording_data = array( $url );

    $this->set_variable( 'recording_data', $recording_data );

    // find the ids of the prev and next test_entrys
    $db_prev_test_entry = $db_test_entry->get_previous();
    $db_next_test_entry = $db_test_entry->get_next();

    $this->set_variable( 'prev_test_entry_id',
      is_null( $db_prev_test_entry ) ? 0 : $db_prev_test_entry->id );

    $this->set_variable( 'next_test_entry_id',
      is_null( $db_next_test_entry ) ? 0 : $db_next_test_entry->id );

    $this->set_variable( 'editable', $this->editable ? 1 : 0 );
    $this->set_variable( 'actionable', $this->actionable ? 1 : 0 );

    try
    {
      $this->test_entry_widget->process();
      $this->set_variable( 'test_entry_args', $this->test_entry_widget->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * Determines whether the record can be edited.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public function get_editable()
  {
    return $this->editable;
  }

  /**
   * Determines whether the action buttons are enabled.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public function get_actionable()
  {
    return $this->actionable;
  }

  /**
   * Set whether the record can be edited.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public function set_editable( $enable )
  {
    $this->editable = $enable;
  }

  /**
   * Set whether the action buttons are enabled.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public function set_actionable( $enable )
  {
    $this->actionable = $enable;
  }

  /**
   * Determines whether the html input elements are enabled.
   * @var boolean
   * @access private
   */
  private $editable = true;

  /**
   * Determines whether the action buttons should be available.
   * @var boolean
   * @access private
   */
   private $actionable = true;

  /**
   * The test entry widget.
   * @var test_entry_widget
   * @access protected
   */
  protected $test_entry_widget = NULL;
}
