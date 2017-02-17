define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'premat_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'pre-MAT' );
  module.addInputGroup( '', { value: { type: 'boolean' } } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnPrematDataView', [
    'CnPrematDataModelFactory',
    function( CnPrematDataModelFactory ) {
      return cenozoApp.initDataViewDirective( module, CnPrematDataModelFactory.root );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPrematDataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPrematDataModelFactory', [
    'CnBaseDataModelFactory', 'CnPrematDataViewFactory',
    function( CnBaseDataModelFactory, CnPrematDataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnPrematDataViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
