define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey1_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'REY 1' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRey1DataView', [
    'CnRey1DataModelFactory',
    function( CnRey1DataModelFactory ) {
      return cenozoApp.initDataViewDirective( module, CnRey1DataModelFactory.root );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRey1DataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRey1DataModelFactory', [
    'CnBaseDataModelFactory', 'CnRey1DataViewFactory',
    function( CnBaseDataModelFactory, CnRey1DataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnRey1DataViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
