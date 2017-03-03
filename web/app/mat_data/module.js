define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'mat_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'MAT' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMatDataView', [
    'CnMatDataModelFactory', '$timeout',
    function( CnMatDataModelFactory, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) { 
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnPrematDataModelFactory.root;
          $scope.isComplete = false;
          $scope.isWorking = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          angular.extend( $scope, {
            newWordCache: '',
            checkNewWord: function() {
              // if the match fails then go back to the cache
              if( null == $scope.newWord.match( /^([0-9]|[1-9][0-9]{0,4}|[a-z])?$/ ) )
                $scope.newWord = $scope.newWordCache;
              // otherwise set the cache to the new word
              else $scope.newWordCache = $scope.newWord;
            },
            submitNewWord: function() {
              if( 0 < $scope.newWord.length ) {
                $scope.isWorking = true;
                $scope.model.viewModel.submitWord( $scope.newWord )
                  .then( function() { $scope.newWord = ''; $scope.newWordCache = ''; } )
                  .finally( function() {
                    $scope.isWorking = false;
                    $timeout( function() { document.getElementById( 'newWord' ).focus(); }, 20 );
                  } );
              }
            },
            changeWord: function( index ) {
              $scope.isWorking = true;
              $scope.model.viewModel.changeWord( index ).finally( function() { $scope.isWorking = false; } );
            },
            deleteWord: function( index ) {
              $scope.isWorking = true;
              $scope.model.viewModel.deleteWord( index ).finally( function() { $scope.isWorking = false; } );
            }
          } );
        }   
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMatDataViewFactory', [
    'CnBaseDataViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseDataViewFactory, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseDataViewFactory.construct( this, parentModel, root );

        angular.extend( this, {
          submitWord: function( word ) {
            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath(),
              data: { value: word }
            } ).post().then( function( response ) {
              self.record.push( { id: response.data, word: word } );
            } );
          },
          deleteWord: function( index ) {
            if( angular.isDefined( this.record[index] ) ) {
              return CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath() + '/' + this.record[index].id
              } ).delete().then( function() {
                self.record.splice( index, 1 );
              } );
            } else return $q.all();
          },
          changeWord: function( index ) {
            if( angular.isDefined( this.record[index] ) ) {
              return CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath() + '/' + this.record[index].id,
                data: { value: this.record[index].word }
              } ).patch()
            } else return $q.all();
          }
        } );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnMatDataModelFactory', [
    'CnBaseDataModelFactory', 'CnMatDataViewFactory',
    function( CnBaseDataModelFactory, CnMatDataViewFactory ) {
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnMatDataViewFactory.instance( this, root );
        this.testEntryModel = testEntryModel;

        this.getServiceData = function( type, columnRestrictLists ) {
          var data = this.$$getServiceData( type, columnRestrictLists );
          if( 'view' == type ) {
            if( angular.isUndefined( data.modifier ) ) data.modifier = {};
            angular.extend( data.modifier, {
              order: { rank: false },
              limit: 10000 // do not limit the number of records returned
            } );
            data.select = { column: [ 'id', { column: 'value', alias: 'word' } ] };
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
