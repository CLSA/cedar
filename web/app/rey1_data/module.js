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
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnRey1DataModelFactory', [
    'CnBaseModelFactory', 'CnRey1DataViewFactory', '$state',
    function( CnBaseModelFactory, CnRey1DataViewFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.viewModel = CnRey1DataViewFactory.instance( this, root );

        this.getServiceResourcePath = function( resource ) {
          return 'rey1_data/test_entry_id=' + $state.params.identifier;
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
