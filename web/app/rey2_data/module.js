define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey2_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'REY 2' );
  module.addInputGroup( '', { value: { type: 'boolean' } } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRey2DataView', [
    'CnRey2DataModelFactory',
    function( CnRey2DataModelFactory ) {
      return cenozoApp.initDataViewDirective( module, CnRey2DataModelFactory.root );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRey2DataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRey2DataModelFactory', [
    'CnBaseDataModelFactory', 'CnRey2DataViewFactory',
    function( CnBaseDataModelFactory, CnRey2DataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnRey2DataViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
