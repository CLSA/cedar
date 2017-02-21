define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'mat_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'MAT' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnSubmitWord', [
    function() {
      return {
        restrict: 'A',
        require: 'ngModel',
        controller: function( $scope ) { $scope.directive = 'cnSubmitWord'; },
        link: function( scope, element, attrs ) {
          element.bind( 'keydown', function( event ) {
            scope.$evalAsync( function() { if( 13 == event.which ) scope.$eval( attrs.cnSubmitWord ); } );
          } );
        }
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnMatDataView', [
    'CnMatDataModelFactory', 'CnHttpFactory', '$timeout',
    function( CnMatDataModelFactory, CnHttpFactory, $timeout ) {
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
                  .then( function() { $scope.newWord = ''; } )
                  .finally( function() {
                    $scope.isWorking = false;
                    $timeout( function() { document.getElementById( 'newWord' ).focus(); }, 20 );
                  } );
              }
            },
            deleteWord: function( rank ) {
              $scope.isWorking = true;
              $scope.model.viewModel.deleteWord( rank ).finally( function() { $scope.isWorking = false; } );
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
            } ).post().then( function() {
              self.record.push( { word: word } );
            } );
          },
          deleteWord: function( rank ) {
            var deletedWord = null;
            var wordList = angular.copy( this.record );
            wordList.forEach( function( word, index, array ) {
              if( rank == word.rank ) deletedWord = array.splice( index, 1 )[0];
              else if( rank < word.rank ) word.rank--;
            } );

            return null != deletedWord ?
              CnHttpFactory.instance( {
                path: this.parentModel.getServiceResourcePath() + '/' + deletedWord.id
              } ).delete().then( function() {
                self.record = wordList;
              } ) : $q.all();
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
            data.select = { column: [ 'rank', { column: 'value', alias: 'word' } ] };
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
