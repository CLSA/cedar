define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey1_data', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id',
      }
    },
    name: {
      singular: 'REY1 Data',
      plural: 'REY1 Data',
      possessive: 'REY1 Data\'s',
      pluralPossessive: 'REY1 Data\''
    }
  } );

  module.addInputGroup( '', {
    value: { type: 'boolean' },
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnRey1DataView', [
    'CnRey1DataModelFactory',
    function( CnRey1DataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnRey1DataModelFactory.root;

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
