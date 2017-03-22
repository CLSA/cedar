define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'fas_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'FAS' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFasDataView', [
    'CnFasDataModelFactory', 'CnHttpFactory', 'CnModalConfirmFactory', '$timeout',
    function( CnFasDataModelFactory, CnHttpFactory, CnModalConfirmFactory, $timeout ) {
      return {
        templateUrl: cenozoApp.getFileUrl( 'cedar', 'view-rank-data.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnFasDataModelFactory.root;
          cenozoApp.initRankDataViewDirectiveController( $scope, CnHttpFactory, CnModalConfirmFactory, $timeout );
        }
      }
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
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module, root, CnFasDataViewFactory );
        angular.extend( this, {
          viewModel: CnFasDataViewFactory.instance( this, root ),
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
