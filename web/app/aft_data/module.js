define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'aft_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'AFT' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAftDataView', [
    'CnAftDataModelFactory', 'CnHttpFactory', 'CnModalConfirmFactory', '$timeout',
    function( CnAftDataModelFactory, CnHttpFactory, CnModalConfirmFactory, $timeout ) {
      return {
        templateUrl: cenozoApp.getFileUrl( 'cedar', 'view-rank-data.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnAftDataModelFactory.root;
          cenozoApp.initRankDataViewDirectiveController( $scope, CnHttpFactory, CnModalConfirmFactory, $timeout );
        }
      }
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
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module, root, CnAftDataViewFactory );
        angular.extend( this, {
          viewModel: CnAftDataViewFactory.instance( this, root ),
          testEntryModel: testEntryModel
        } );
      };
      return {
        root: new object( true ),
        instance: function( testEntryModel ) { return new object( false, testEntryModel ); }
      };
    }
  ] );

} );
