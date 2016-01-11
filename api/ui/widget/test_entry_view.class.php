<?php
/**
 * test_entry_view.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\widget;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * widget test_entry view
 */
class test_entry_view extends \cenozo\ui\widget\base_view
{
  /**
   * Constructor
   *
   * Defines all variables which need to be set for the associated template.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args An associative array of arguments to be processed by the widget
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'test_entry', 'view', $args );
  }

  /**
   * Processes arguments, preparing them for the operation.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @throws exception\runtime
   * @access protected
   */
  protected function prepare()
  {
    $operation_class_name = lib::get_class_name( 'database\operation' );

    $this->set_removable( false );

    parent::prepare();

    $db_test_entry = $this->get_record();
    $test_type_name = $db_test_entry->get_test()->get_test_type()->name;

    $is_deferred = in_array( $db_test_entry->deferred, array( 'requested', 'pending' ) );
    $is_submitted = 'submitted' == $db_test_entry->completed;
    $db_assignment = $db_test_entry->get_assignment();
    $is_closed = !is_null( $db_assignment->end_datetime );

    // add items to the view
    $this->add_item( 'participant.uid', 'constant', 'UID' );
    $this->add_item( 'cohort.name', 'constant', 'Cohort' );
    $this->add_item( 'user.name', 'constant', 'Typist' );
    $this->add_item( 'test.name', 'constant', 'Test' );
    $this->add_item( 'test.name', 'constant', 'Test' );
    $this->add_item( 'audio_status',
      $is_deferred || $is_submitted ? 'constant' : 'enum', 'Audio Status' );
    $this->add_item( 'participant_status',
      $is_deferred || $is_submitted ? 'constant' : 'enum', 'Participant Status' );
    $this->add_item( 'deferred',
      $is_deferred ? 'enum' : 'constant', 'Deferred' );
    $this->add_item( 'completed', 'constant', 'Completed' );

    $this->language_list = lib::create( 'ui\widget\language_list', $this->arguments );
    $this->language_list->set_parent( $this );
    $this->language_list->set_viewable( false );
    $allow_language_edit = in_array( $test_type_name,
      array( 'ranked_word', 'classification' ) );
    $this->language_list->set_addable( $allow_language_edit );
    $this->language_list->set_removable( $allow_language_edit );

    // create the test_entry_transcribe sub widget
    if( 'typist' ==  lib::create( 'business\session' )->get_role()->name )
      throw lib::create( 'exception\runtime',
        'Only administrators and supervisors can view transcriptions within a test_entry_view',
        __METHOD__ );

    $this->test_entry_transcribe = lib::create( 'ui\widget\test_entry_transcribe',
      array( 'test_entry_transcribe' => array( 'id' => $this->get_argument( 'id' ) ) ) );
    $this->test_entry_transcribe->set_parent( $this );
    $this->test_entry_transcribe->set_validate_access( false );
    $this->test_entry_transcribe->set_editable( false );
    $this->test_entry_transcribe->set_actionable( false );

    $db_operation = $operation_class_name::get_operation( 'push', 'test_entry', 'return' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) && !$is_closed )
    {
      $this->add_action( 'return', 'Return', NULL, 'Return this test to the typist' );
    }
  }

  /**
   * Finish setting the variables in a widget.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function setup()
  {
    parent::setup();

    $test_entry_class_name = lib::get_class_name( 'database\test_entry' );

    $db_test_entry = $this->get_record();
    $db_assignment = $db_test_entry->get_assignment();
    $db_test = $db_test_entry->get_test();
    $db_participant = $db_assignment->get_participant();

    // set the view's items
    $this->set_item( 'participant.uid', $db_participant->uid );
    $this->set_item( 'cohort.name', $db_participant->get_cohort()->name );

    $this->set_item( 'user.name', $db_assignment->get_user()->name );
    $this->set_item( 'test.name', $db_test->name );

    $is_deferred = in_array( $db_test_entry->deferred, array( 'requested', 'pending' ) );
    $is_submitted = 'submitted' == $db_test_entry->completed;

    if( $is_deferred || $is_submitted )
    {
      $this->set_item( 'audio_status',
        is_null( $db_test_entry->audio_status ) ? 'NA' : $db_test_entry->audio_status );

      $this->set_item( 'participant_status',
        is_null( $db_test_entry->participant_status ) ? 'NA' : $db_test_entry->participant_status );
    }
    else
    {
      $audio_status_list = $test_entry_class_name::get_enum_values( 'audio_status' );
      $audio_status_list = array_combine( $audio_status_list, $audio_status_list );
      $audio_status_list = array_reverse( $audio_status_list, true );
      $audio_status_list['NULL'] = '';
      $audio_status_list = array_reverse( $audio_status_list, true );
      $this->set_item( 'audio_status',
        $db_test_entry->audio_status, true, $audio_status_list );

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

      $this->set_item( 'participant_status',
        $db_test_entry->participant_status, true, $participant_status_list );
    }

    if( $is_deferred )
    {
      $deferred_list = $test_entry_class_name::get_enum_values( 'deferred' );
      $deferred_list = array_combine( $deferred_list, $deferred_list );
      unset( $deferred_list['resolved'] );
      $this->set_item( 'deferred',
        $db_test_entry->deferred, true, $deferred_list );
    }
    else
      $this->set_item( 'deferred',
        is_null( $db_test_entry->deferred ) ? 'No' : ucwords( $db_test_entry->deferred ) );

    $this->set_item( 'completed', ucwords( $db_test_entry->completed )  );

    try
    {
      $this->language_list->process();
      $this->set_variable( 'language_list', $this->language_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}

    try
    {
      $this->test_entry_transcribe->process();
      $this->set_variable( 'test_entry_transcribe', $this->test_entry_transcribe->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * Overrides the language list widget's method.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return int
   * @access protected
   */
  public function determine_language_count( $modifier = NULL )
  {
    $language_class_name = lib::get_class_name( 'database\language' );
    if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'test_entry_has_language.test_entry_id', '=', $this->get_record()->id );
    return $language_class_name::count( $modifier );
  }

  /**
   * Overrides the language list widget's method.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param database\modifier $modifier Modifications to the list.
   * @return array( record )
   * @access protected
   */
  public function determine_language_list( $modifier = NULL )
  {
    $language_class_name = lib::get_class_name( 'database\language' );
    if( NULL == $modifier ) $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'test_entry_has_language.test_entry_id', '=', $this->get_record()->id );
    return $language_class_name::select( $modifier );
  }

  /**
   * The test_entry_transcribe widget.
   * @var test_entry_transcribe
   * @access protected
   */
  protected $test_entry_transcribe = NULL;

  /**
   * The language list widget.
   * @var language_list
   * @access protected
   */
  protected $language_list = NULL;
}
