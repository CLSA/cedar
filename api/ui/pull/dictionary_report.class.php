<?php
/**
 * dictionary_report.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\ui\pull;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * pull: dictionary report
 *
 * Generate a report file containing the list of words in a dictionary.
 */
class dictionary_report extends \cenozo\ui\pull\base_report
{
  /**
   * Constructor
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param array $args Pull arguments.
   * @access public
   */
  public function __construct( $args )
  {
    parent::__construct( 'dictionary', $args );
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

    // check to see if a dictionary-specific template exists for this report
    $db_dictionary = lib::create( 'database\dictionary', $this->get_argument( 'dictionary_id' ) );
    $filename = sprintf( '%s/report/%s_%s.xls',
                         DOC_PATH,
                         $this->get_full_name(),
                         $db_dictionary->name );
    if( file_exists( $filename ) ) $this->report = lib::create( 'business\report', $filename );
  }

  /**
   * Builds the report.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access protected
   */
  protected function build()
  {
    $word_class_name = lib::get_class_name( 'database\word' );

    $this->report->set_orientation( 'landscape' );

    $db_dictionary = lib::create( 'database\dictionary', $this->get_argument( 'dictionary_id' ) );

    // loop through all the words
    $word_mod = lib::create( 'database\modifier' );
    $word_mod->where( 'dictionary_id', '=', $db_dictionary->id );
    $contents = array();
    foreach( $word_class_name::select( $word_mod ) as $db_word )
    {
      $contents[] = array( $db_word->word, $db_word->get_language()->code, $db_word->get_usage_count() );
    }

    $word_count = $db_dictionary->get_word_count();
    $this->add_title( strtoupper( $db_dictionary->name ) .
                      ' Dictionary ( ' . $word_count . ' entries )' );

    // create the content and header arrays using the data
    $header = array( 'Word', 'Language', 'usage'  );
    $this->add_table( NULL, $header, $contents );
  }
}
