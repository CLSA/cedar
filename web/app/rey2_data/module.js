define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey2_data', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id',
      }
    },
    name: {
      singular: 'REY2 Data',
      plural: 'REY2 Data',
      possessive: 'REY2 Data\'s',
      pluralPossessive: 'REY2 Data\''
    }
  } );

  module.addInputGroup( '', {
    value: { type: 'boolean' },
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRey2DataView', [
    'CnRey2DataModelFactory',
    function( CnRey2DataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRey2DataModelFactory.root;

          $scope.isComplete = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          $scope.refresh = function() {
            if( $scope.isComplete ) {
              $scope.isComplete = false;
              $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true } );
            }
          };

          $scope.patch = function() {
            if( $scope.model.getEditEnabled() )
              $scope.model.viewModel.onPatch( { value: $scope.model.viewModel.record.value } );
          };
        }
      };
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
