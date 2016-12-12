define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'mat_data', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id',
      }
    },
    name: {
      singular: 'MAT Data',
      plural: 'MAT Data',
      possessive: 'MAT Data\'s',
      pluralPossessive: 'MAT Data\''
    }
  } );

  module.addInputGroup( '', {
    value: { type: 'boolean' },
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMatDataView', [
    'CnMatDataModelFactory',
    function( CnMatDataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnMatDataModelFactory.root;

          $scope.patch = function() {
            if( $scope.model.getEditEnabled() )
              $scope.model.viewModel.onPatch( { value: $scope.model.viewModel.record.value } );
          };
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMatDataViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMatDataModelFactory', [
    'CnBaseModelFactory', 'CnMatDataViewFactory', '$state',
    function( CnBaseModelFactory, CnMatDataViewFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.viewModel = CnMatDataViewFactory.instance( this, root );

        this.getServiceResourcePath = function( resource ) {
          return 'mat_data/test_entry_id=' + $state.params.identifier;
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
