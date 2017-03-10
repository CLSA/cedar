define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'aft_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'AFT' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnAftDataView', [
    'CnAftDataModelFactory',
    function( CnAftDataModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnPrematDataModelFactory.root;
          $scope.isComplete = false;
          $scope.isWorking = false;
          $scope.typeaheadIsLoading = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          angular.extend( $scope, {
            submitNewWord: function() {
              // string if it's a new word, integer if it's an existing intrusion
              if( angular.isObject( $scope.newWord ) || 0 < $scope.newWord.length ) { 
                $scope.isWorking = true;
                var word = $scope.newWord;
                $scope.newWord = ''; 
                $scope.model.viewModel.submitIntrusion( word ).finally( function() {
                  $scope.isWorking = false;
                  $timeout( function() { document.getElementById( 'newWord' ).focus(); }, 20 );
                } );
              }
            },
            deleteWord: function( word ) { 
              $scope.isWorking = false;
              $scope.model.viewModel.deleteIntrusion( word ).finally( function() { $scope.isWorking = false; } );
            },
            getTypeaheadValues: function( viewValue ) { 
              $scope.typeaheadIsLoading = true;
              return CnHttpFactory.instance( {
                path: 'word',
                data: {
                  select: { column: [ 'id', 'word' ] },
                  modifier: {
                    where: [
                      { column: 'misspelled', operator: '=', value: false },
                      { column: 'word', operator: 'LIKE', value: viewValue + '%' }
                    ]   
                  }   
                }   
              } ).query().then( function( response ) { 
                $scope.typeaheadIsLoading = false;
                return response.data;
              } );
            }   
          } );
        }   
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAftDataViewFactory', [
    'CnBaseDataViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseDataViewFactory, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) { CnBaseDataViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnAftDataModelFactory', [
    'CnBaseDataModelFactory', 'CnAftDataViewFactory',
    function( CnBaseDataModelFactory, CnAftDataViewFactory ) {
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnAftDataViewFactory.instance( this, root );
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
