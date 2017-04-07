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
            cursor: null,
            cursorType: null,
            toggleCursor: function( rank ) {
              if( null == $scope.cursorType ) {
                $scope.cursorType = 'insert';
                $scope.cursor = rank;
              } else if( 'insert' == $scope.cursorType ) {
                if( rank == $scope.cursor ) {
                  $scope.cursorType = 'replace';
                } else {
                  $scope.cursorType = 'insert';
                  $scope.cursor = rank;
                }
              } else {
                if( rank == $scope.cursor ) {
                  $scope.cursorType = null;
                  $scope.cursor = null;
                } else {
                  $scope.cursorType = 'insert';
                  $scope.cursor = rank;
                }
              }

              document.getElementById( 'newWord' ).focus();
            },
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
                $scope.model.viewModel.submitWord( $scope.newWord, $scope.cursor, 'replace' == $scope.cursorType )
                  .then( function() { $scope.newWord = ''; $scope.newWordCache = ''; } )
                  .finally( function() {
                    $scope.cursor = null;
                    $scope.cursorType = null;
                    $scope.isWorking = false;
                    $timeout( function() { document.getElementById( 'newWord' ).focus(); }, 20 );
                  } );
              }
            },
            removeWord: function( index ) {
              $scope.isWorking = true;
              $scope.model.viewModel.deleteWord( index ).finally( function() {
                // we may have to change the cursor if it is no longer valid
                if( null != $scope.cursor ) {
                  var len = $scope.model.viewModel.record.length;
                  if( 0 == len || $scope.model.viewModel.record[len-1].rank < $scope.cursor ) {
                    $scope.cursor = null;
                    $scope.cursorType = null;
                  }
                }

                $scope.isWorking = false;
                document.getElementById( 'newWord' ).focus();
              } );
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
          submitWord: function( word, rank, replace ) {
            var data = { value: word };
            if( null != rank ) data.rank = rank;

            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath(),
              data: data
            } ).post().then( function( response ) {
              if( null != rank ) {
                var index = self.record.findIndexByProperty( 'rank', rank );
                if( null != index ) {
                  // remove the word at the found index if we are in replace mode
                  if( replace ) {
                    return CnHttpFactory.instance( {
                      path: self.parentModel.getServiceResourcePath() + '/' + self.record[index].id
                    } ).delete().then( function() {
                      self.record.splice( index, 1, response.data );
                    } );
                  } else {
                    self.record.forEach( function( word ) { if( word.rank >= rank ) word.rank++; } );
                    self.record.splice( index, 0, response.data );
                  }
                } else {
                  console.warning(
                    'Tried inserting word at rank "' + rank + '", which was not found in the list'
                  );
                }
              } else {
                self.record.push( response.data );
              }
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
            data.select = { column: [ 'id', 'rank', { column: 'value', alias: 'word' } ] };
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
