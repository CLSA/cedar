define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'fas_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'FAS' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFasDataView', [
    'CnFasDataModelFactory',
    function( CnFasDataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnPrematDataModelFactory.root;
          $scope.isComplete = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );
        }   
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFasDataViewFactory', [
    'CnBaseDataViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseDataViewFactory, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnFasDataModelFactory', [
    'CnBaseDataModelFactory', 'CnFasDataViewFactory',
    function( CnBaseDataModelFactory, CnFasDataViewFactory ) {
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnFasDataViewFactory.instance( this, root );
        this.testEntryModel = testEntryModel;

        this.getServiceData = function( type, columnRestrictLists ) {
          var data = this.$$getServiceData( type, columnRestrictLists );
          if( 'view' == type ) {
            if( angular.isUndefined( data.modifier ) ) data.modifier = {};
            angular.extend( data.modifier, {
              order: { rank: false },
              limit: 10000 // do not limit the number of records returned
            } );
            data.select = { column: [ 'rank', { table: 'word', column: 'word' } ] };
          }
          return data;
        };
      };

      return {
        root: new object( true ),
        instance: function( testEntryModel ) { return new object( false, testEntryModel ); }
      };
    }
  ] );

} );
