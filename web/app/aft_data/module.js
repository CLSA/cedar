define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'aft_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'AFT' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAftDataView', [
    'CnAftDataModelFactory',
    function( CnAftDataModelFactory ) {
      return cenozoApp.initDataViewDirective( module, CnAftDataModelFactory.root );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAftDataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAftDataModelFactory', [
    'CnBaseDataModelFactory', 'CnAftDataViewFactory',
    function( CnBaseDataModelFactory, CnAftDataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnAftDataViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
