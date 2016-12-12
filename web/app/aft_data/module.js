define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'aft_data', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'test_entry',
        column: 'test_entry_id',
      }
    },
    name: {
      singular: 'AFT Data',
      plural: 'AFT Data',
      possessive: 'AFT Data\'s',
      pluralPossessive: 'AFT Data\''
    }
  } );

  module.addInputGroup( '', {
    value: { type: 'boolean' },
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAftDataView', [
    'CnAftDataModelFactory',
    function( CnAftDataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAftDataModelFactory.root;

          $scope.patch = function() {
            if( $scope.model.getEditEnabled() )
              $scope.model.viewModel.onPatch( { value: $scope.model.viewModel.record.value } );
          };
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAftDataViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAftDataModelFactory', [
    'CnBaseModelFactory', 'CnAftDataViewFactory', '$state',
    function( CnBaseModelFactory, CnAftDataViewFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.viewModel = CnAftDataViewFactory.instance( this, root );

        this.getServiceResourcePath = function( resource ) {
          return 'aft_data/test_entry_id=' + $state.params.identifier;
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
