define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'premat_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'pre-MAT' );
  module.addInputGroup( '', {
    counting: { type: 'boolean' },
    alphabet: { type: 'boolean' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnPrematDataView', [
    'CnPrematDataModelFactory',
    function( CnPrematDataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: async function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnPrematDataModelFactory.root;
          $scope.isComplete = false;
          try {
            await $scope.model.viewModel.onView();
          } finally {
            $scope.isComplete = true;
          }

          $scope.patch = function( property ) {
            if( $scope.model.getEditEnabled() ) {
              var data = {};
              data[property] = $scope.model.viewModel.record[property];
              $scope.model.viewModel.onPatch( data );
            }
          };
        }   
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPrematDataViewFactory', [
    'CnBaseDataViewFactory',
    function( CnBaseDataViewFactory ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); };
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnPrematDataModelFactory', [
    'CnBaseDataModelFactory', 'CnPrematDataViewFactory',
    function( CnBaseDataModelFactory, CnPrematDataViewFactory ) {
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnPrematDataViewFactory.instance( this, root );
        this.testEntryModel = testEntryModel;
      };

      return {
        root: new object( true ),
        instance: function( testEntryModel ) { return new object( false, testEntryModel ); }
      };
    }
  ] );

} );
