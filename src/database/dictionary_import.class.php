<?php
/**
 * dictionary_import.class.php
 *
 * @author Dean Inglis <inglisd@mcmaster.ca>
 * @filesource
 */

namespace cedar\database;
use cenozo\lib, cenozo\log, cedar\util;

/**
 * dictionary_import: record
 */
class dictionary_import extends \cenozo\database\record
{
  /**
   * Overrides the parent method in order to read the data column.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param string $column_name The name of the column or table being fetched from the database
   * @return mixed
   * @access public
   */
  public function __get( $column_name )
  {
    // only override if the column is "data"
    if( 'data' != $column_name &&
        'serialization' != $column_name ) return parent::__get( $column_name );

    // the record does not read mediumblob types, so custom sql is needed
    if( !is_null( $this->id ) )
    { // read the data from the database
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', '=', $this->id );
      $this->data_value[ $column_name ] = static::db()->get_one( sprintf(
        'SELECT %s FROM %s %s',
        $column_name,
        static::get_table_name(),
        $modifier->get_sql() ) );
    }

    return $this->data_value[ $column_name ];
  }

  /**
   * Overrides the parent method in order to write to the data column.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @param string $column_name The name of the column
   * @param mixed $value The value to set the contents of a column to
   * @access public
   */
  public function __set( $column_name, $value )
  {
    if( 'data' != $column_name &&
        'serialization' != $column_name ) parent::__set( $column_name, $value );
    else
    {
      $this->data_value[ $column_name ] = $value;
      $this->data_changed[ $column_name ] = true;
    }
  }

  /**
   * Overrides the parent method in order to deal with the data column.
   * @author Dean Inglis <inglisd@mcmaster.ca>
   * @access public
   */
  public function save()
  {
    // first save the record as usual
    parent::save();

    if( $this->read_only )
    {
      log::warning( 'Tried to save read-only record.' );
      return;
    }

    // now save the data if it is not null
    if( !is_null( $this->id ) )
    {
      $modifier = lib::create( 'database\modifier' );
      $modifier->where( 'id', '=', $this->id );
      foreach( $this->data_changed as $column_name => $changed )
      {
        if( $changed )
        {
          static::db()->execute( sprintf(
            'UPDATE %s SET %s = %s %s',
            static::get_table_name(),
            $column_name,
            static::db()->format_string( $this->data_value[ $column_name ] ),
            $modifier->get_sql() ) );
          $this->data_changed[ $column_name ] = false;
        }
      }
    }
  }

  /**
   * Whether or not the data column has been changed.
   * @var boolean $data_changed
   * @access protected
   */
  protected $data_changed = array( 'data' => false,
                                   'serialization' => false );

  /**
   * A temporary ivar to hold the value of the data column (if it is set).
   * @var boolean $data_value
   * @access protected
   */
  protected $data_value = array( 'data' => NULL,
                                 'serialization' => NULL );
}
