<?php
/**
 * word_view.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\widget;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * widget word view
 */
class word_view extends \cenozo\ui\widget\base_view
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
    parent::__construct( 'word', 'view', $args );
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

    $operation_class_name = lib::get_class_name( 'database\operation' );

    // add items to the view
    $this->add_item( 'word', 'string', 'Word' );
    $this->add_item( 'language_id', 'enum', 'Language' );

    // allow words to be moved within dictionaries that are referenced by a test
    $this->add_item( 'dictionary_id', 'enum', 'Dictionary' );

    if( false !== stripos( $this->get_record()->get_dictionary()->name, 'variant' ) )
    {
      $db_operation = $operation_class_name::get_operation( 'push', 'word', 'correct' );
      if( lib::create( 'business\session' )->get_role()->has_operation( $db_operation ) )
        $this->add_action( 'correct', 'Correct Misspelling', NULL,
          'Correct a misspelling and have all tests using it automatically update to the corrected word.' );
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
    $test_class_name = lib::get_class_name( 'database\test' );

    $db_word = $this->get_record();

    $modifier = lib::create( 'database\modifier' );
    $modifier->where( 'dictionary_id', '=', $db_word->dictionary_id );
    $modifier->or_where( 'variant_dictionary_id', '=', $db_word->dictionary_id );
    $modifier->or_where( 'intrusion_dictionary_id', '=', $db_word->dictionary_id );
    $modifier->or_where( 'mispelled_dictionary_id', '=', $db_word->dictionary_id );
    $db_test = current( $test_class_name::select( $modifier ) );

    // get the dictionaries that reference this test
    $dictionary_list = array();
    $dictionary_type = array( '', 'variant_', 'intrusion_', 'mispelled_' );
    foreach( $dictionary_type as $type )
    {
      $get_method = 'get_' . $type . 'dictionary';
      $db_dictionary = $db_test->$get_method();
      if( !is_null( $db_dictionary ) )
       $dictionary_list[ $db_dictionary->id ] = $db_dictionary->name;
    }

    $language_list = array();
    if( 'ranked_word' != $db_test->get_test_type()->name )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'active', '=', true );
      foreach( $language_class_name::select( $modifier ) as $db_language )
        $language_list[ $db_language->id ] = $db_language->name;
    }
    else
    {
      $db_language = $db_word->get_language();
      $language_list[ $db_language->id ] = $db_language->name;
    }

    // set the view's items
    $this->set_item( 'word', $db_word->word, true );
    $this->set_item( 'language_id', $db_word->language_id, true, $language_list );
    $this->set_item( 'dictionary_id', $db_word->dictionary_id, true, $dictionary_list );
  }
}
