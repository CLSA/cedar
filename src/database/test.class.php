<?php
/**
 * test.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * test: record
 */
class test extends \cenozo\database\has_rank
{
  /**
   * Get the variant dictionary.
   * This method is required because there is no variant_dictionary table,
   * only a dictionary table.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return record() db_dictionary or NULL
   */
  public function get_variant_dictionary()
  {
    return is_null( $this->variant_dictionary_id ) ? NULL :
           lib::create( 'database\dictionary', $this->variant_dictionary_id );
  }

  /**
   * Get the intrusion dictionary.
   * This method is required because there is no intrusion_dictionary table,
   * only a dictionary table.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return record() db_dictionary or NULL
   */
  public function get_intrusion_dictionary()
  {
    return is_null( $this->intrusion_dictionary_id ) ? NULL :
           lib::create( 'database\dictionary', $this->intrusion_dictionary_id );
  }

  /**
   * Get the mispelled dictionary.
   * This method is required because there is no mispelled_dictionary table,
   * only a dictionary table.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @return record() db_dictionary or NULL
   */
  public function get_mispelled_dictionary()
  {
    return is_null( $this->mispelled_dictionary_id ) ? NULL :
           lib::create( 'database\dictionary', $this->mispelled_dictionary_id );
  }

  /**
   * Classify a word based on test's dictionary membership.
   * All tests must have a primary dictionary assigned. Non-strict tests
   * must also have variant and intrusion dictionaries assigned.
   *
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   * @throws exception\runtime
   * @param string $word A non-empty word (can be NULL if word_id is not NULL).
   * @param integer $word_id  The id of a word or NULL.
   * @param database\language $db_language The language of the word or NULL.
   * @return array()  classification={candidate, primary, intrusion, variant, mispelled}, word id
   */
  public function get_word_classification( $word, $word_id, $db_language )
  {
    // all tests must have a primary dictionary assigned
    // non-strict tests must also have variant and intrusion dictionaries assigned
    if( ( !$this->strict && is_null( $this->dictionary_id ) ) ||
         ( is_null( $this->dictionary_id ) ||
           is_null( $this->intrusion_dictionary_id ) ||
           is_null( $this->variant_dictionary_id ) ) )
      throw lib::create( 'exception\runtime',
        'Word classification requires the test to have the necessary ' .
        'dictionaries assigned.', __METHOD__ );

    $classification = array_combine(
      array( $this->dictionary_id,
             $this->intrusion_dictionary_id,
             $this->variant_dictionary_id,
             $this->mispelled_dictionary_id ),
      array( 'primary', 'intrusion', 'variant', 'mispelled' ) );

    $word_class_name = lib::get_class_name( 'database\word' );

    $data['classification'] = 'candidate';
    $data['word'] = $word;
    $data['word_id'] = '';
    if( !is_null( $word_id ) )
    {
      $db_word = lib::create( 'database\word', $word_id );
      $data['word'] = $db_word->word;
      $data['word_id'] = $db_word->id;
      if( array_key_exists( $db_word->dictionary_id, $classification ) )
      {
        $data['classification'] = $classification[$db_word->dictionary_id];
        if( 'en' != $db_word->get_language()->code ) $data['classification'] .= '_fr';
      }
    }
    else
    {
      $base_mod = lib::create( 'database\modifier' );
      if( !is_null( $db_language ) ) $base_mod->where( 'language_id', '=', $db_language->id );
      $base_mod->where( 'word', '=', $word );
      $base_mod->limit( 1 );
      $db_word = false;

      // check for mispelled words first
      if( !is_null( $this->mispelled_dictionary_id ) )
      {
        $modifier = clone $base_mod;
        $modifier->where( 'dictionary_id', '=', $this->mispelled_dictionary_id );
        $db_word = current( $word_class_name::select( $modifier ) );
      }

      if( false === $db_word )
      {
        $modifier = clone $base_mod;
        $modifier->where( 'dictionary_id', '=', $this->dictionary_id );
        $db_word = current( $word_class_name::select( $modifier ) );
        if( false === $db_word && !$this->strict )
        {
          $modifier = clone $base_mod;
          $modifier->where( 'dictionary_id', '=', $this->intrusion_dictionary_id );
          $db_word = current( $word_class_name::select( $modifier ) );
          if( false === $db_word )
          {
            $modifier = clone $base_mod;
            $modifier->where( 'dictionary_id', '=', $this->variant_dictionary_id );
            $db_word = current( $word_class_name::select( $modifier ) );
          }
        }
      }

      if( $db_word !== false )
      {
        if( array_key_exists( $db_word->dictionary_id, $classification ) )
        {
          $data['classification'] = $classification[$db_word->dictionary_id];
          if( !is_null( $db_language ) && 'en' != $db_language->code )
            $data['classification'] .= '_fr';
        }
        $data['word'] = $db_word->word;
        $data['word_id'] = $db_word->id;
      }
    }
    return $data;
  }
}
