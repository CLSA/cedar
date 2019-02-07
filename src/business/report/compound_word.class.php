<?php
/**
 * compound_word.class.php
 * 
 * @author Patrick Emond <emondpd@mcmaster.ca>
 */

namespace cedar\business\report;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * Call history report
 */
class compound_word extends \cenozo\business\report\base_report
{
  /**
   * Build the report
   * @access protected
   */
  protected function build()
  {
    $word_class_name = lib::get_class_name( 'database\word' );

    $select = lib::create( 'database\select' );
    $select->from( 'word' );
    $select->add_column( 'language.code', 'Language', false );
    $select->add_column( 'word', 'Parent Word' );
    $select->add_column( 'compound_word_1.word', 'Subword 1', false );
    $select->add_column( 'compound_word_2.word', 'Subword 2', false );
    $select->add_column( 'compound_word_3.word', 'Subword 3', false );
    $select->add_column( 'compound_word_4.word', 'Subword 4', false );
    $select->add_column( 'compound_word_5.word', 'Subword 5', false );
    $select->add_column( 'compound_word_6.word', 'Subword 6', false );
    $select->add_column( 'compound_word_7.word', 'Subword 7', false );
    $select->add_column( 'compound_word_8.word', 'Subword 8', false );

    $modifier = lib::create( 'database\modifier' );
    $modifier->join( 'language', 'word.language_id', 'language.id' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_1.word_id', false );
    $join_mod->where( 'compound_1.rank', '=', 1 );
    $modifier->join_modifier( 'compound', $join_mod, '', 'compound_1' );
    $modifier->join( 'word', 'compound_1.sub_word_id', 'compound_word_1.id', '', 'compound_word_1' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_2.word_id', false );
    $join_mod->where( 'compound_2.rank', '=', 2 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_2' );
    $modifier->left_join( 'word', 'compound_2.sub_word_id', 'compound_word_2.id', 'compound_word_2' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_3.word_id', false );
    $join_mod->where( 'compound_3.rank', '=', 3 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_3' );
    $modifier->left_join( 'word', 'compound_3.sub_word_id', 'compound_word_3.id', 'compound_word_3' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_4.word_id', false );
    $join_mod->where( 'compound_4.rank', '=', 4 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_4' );
    $modifier->left_join( 'word', 'compound_4.sub_word_id', 'compound_word_4.id', 'compound_word_4' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_5.word_id', false );
    $join_mod->where( 'compound_5.rank', '=', 5 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_5' );
    $modifier->left_join( 'word', 'compound_5.sub_word_id', 'compound_word_5.id', 'compound_word_5' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_6.word_id', false );
    $join_mod->where( 'compound_6.rank', '=', 6 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_6' );
    $modifier->left_join( 'word', 'compound_6.sub_word_id', 'compound_word_6.id', 'compound_word_6' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_7.word_id', false );
    $join_mod->where( 'compound_7.rank', '=', 7 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_7' );
    $modifier->left_join( 'word', 'compound_7.sub_word_id', 'compound_word_7.id', 'compound_word_7' );

    $join_mod = lib::create( 'database\modifier' );
    $join_mod->where( 'word.id', '=', 'compound_8.word_id', false );
    $join_mod->where( 'compound_8.rank', '=', 8 );
    $modifier->join_modifier( 'compound', $join_mod, 'left', 'compound_8' );
    $modifier->left_join( 'word', 'compound_8.sub_word_id', 'compound_word_8.id', 'compound_word_8' );

    $modifier->group( 'word.id' );
    $modifier->order( 'language.code' );
    $modifier->order( 'word.word' );

    // we need to get the site restriction in order to restrict transcriptions by site
    $report_restriction_sel = lib::create( 'database\select' );
    $report_restriction_sel->add_table_column( 'report_has_report_restriction', 'value' );
    $report_restriction_mod = lib::create( 'database\modifier' );
    $report_restriction_mod->where( 'subject', '=', 'language' );
    $restriction_list =
      $this->db_report->get_report_restriction_list( $report_restriction_sel, $report_restriction_mod );

    if( 0 < count( $restriction_list ) )
    {
      $restriction = current( $restriction_list );
      $modifier->where( 'language.id', '=', $restriction['value'] );
    }

    $this->add_table_from_select( NULL, $word_class_name::select( $select, $modifier ) );
  }
}
