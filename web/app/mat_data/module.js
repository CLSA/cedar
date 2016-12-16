define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'mat_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'MAT' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMatDataView', [
    'CnMatDataModelFactory',
    function( CnMatDataModelFactory ) {
      return cenozoApp.initDataViewDirective( module, CnMatDataModelFactory.root );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMatDataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMatDataModelFactory', [
    'CnBaseDataModelFactory', 'CnMatDataViewFactory',
    function( CnBaseDataModelFactory, CnMatDataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnMatDataViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
