<?php
/**
 * dictionary_view.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\widget;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * widget dictionary view
 */
class dictionary_view extends \cenozo\ui\widget\base_view
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
    parent::__construct( 'dictionary', 'view', $args );
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

    $language_class_name = lib::get_class_name( 'database\language' );
    $operation_class_name = lib::get_class_name( 'database\operation' );

    // create an associative array with everything we want to display about the dictionary
    $this->add_item( 'name', 'string', 'Name' );

    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'active', '=', true );

    foreach( $language_class_name::select( $language_mod ) as $db_language )
    {
      $description = 'Number of ' . $db_language->name . ' words';
      $this->add_item( 'words_' . $db_language->code, 'constant', $description );
    }
    $this->add_item( 'description', 'text', 'Description' );

    // create the word sub-list widget
    $this->word_list = lib::create( 'ui\widget\word_list', $this->arguments );
    $this->word_list->set_parent( $this );
    $this->word_list->set_heading( 'Dictionary words' );

    $db_operation = $operation_class_name::get_operation( 'widget', 'dictionary', 'import' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
    {
      $this->add_action( 'import', 'Import', $db_operation,
        'Import words from a CSV file into the dictionary' );
    }

    $db_operation = $operation_class_name::get_operation( 'widget', 'dictionary', 'transfer_word' );
    if( lib::create( 'business\session' )->is_allowed( $db_operation ) )
    {
      $allow = true;
      // disallow word movement to or from the primary dictionary of ranked_word type tests
      $db_dictionary = $this->get_record();
      $db_test = $db_dictionary->get_owner_test();
      if( !is_null( $db_test ) && $db_test->rank_words )
      {
        $db_primary_dictionary = $db_test->get_dictionary();
        if( !is_null( $db_primary_dictionary ) &&
            $db_primary_dictionary->id == $db_dictionary->id )
          $allow = false;
      }

      if( $allow )
        $this->add_action( 'transfer_word', 'Transfer', $db_operation,
          'Transfer words from the dictionary to another dictionary' );
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

    $language_class_name = lib::get_class_name( 'database\language' );
    $language_mod = lib::create( 'database\modifier' );
    $language_mod->where( 'active', '=', true );

    // set the view's items
    $db_dictionary = $this->get_record();
    $this->set_item( 'name', $db_dictionary->name, true );
    $this->set_item( 'description', $db_dictionary->description );
    $this->set_variable( 'dictionary_id', $db_dictionary->id );

    foreach( $language_class_name::select( $language_mod ) as $db_language )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'word.language_id','=', $db_language->id );
      $this->set_item( 'words_' . $db_language->code, $db_dictionary->get_word_count( $modifier ) );
    }

    try
    {
      $this->word_list->process();
      $this->set_variable( 'word_list', $this->word_list->get_variables() );
    }
    catch( \cenozo\exception\permission $e ) {}
  }

  /**
   * The word list widget.
   * @var word_list
   * @access protected
   */
  protected $word_list = NULL;
}
