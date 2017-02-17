define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'fas_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'FAS' );
  module.addInputGroup( '', { value: { type: 'boolean' } } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFasDataView', [
    'CnFasDataModelFactory',
    function( CnFasDataModelFactory ) {
      return cenozoApp.initDataViewDirective( module, CnFasDataModelFactory.root );
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFasDataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFasDataModelFactory', [
    'CnBaseDataModelFactory', 'CnFasDataViewFactory',
    function( CnBaseDataModelFactory, CnFasDataViewFactory ) {
      var object = function( root ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnFasDataViewFactory.instance( this, root );
        this.inputList = [ 'asdf', 'qwer', 'zxcv', 'rawr', 'lkjh', 'oiuy' ];
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
