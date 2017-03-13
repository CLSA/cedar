define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'fas_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'FAS' );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnFasDataView', [
    'CnFasDataModelFactory', 'CnHttpFactory',
    function( CnFasDataModelFactory, CnHttpFactory ) {
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
                  select: { column: [ 'id', 'word', { table: 'language', column: 'code' } ] },
                  modifier: {
                    where: [ {
                      column: 'language_id',
                      operator: 'IN',
                      value: $scope.model.testEntryModel.viewModel.languageIdList
                    }, {
                      column: 'misspelled', operator: '=', value: false
                    }, {
                      column: 'word', operator: 'LIKE', value: viewValue + '%'
                    } ],
                    order: { word: false }
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
  cenozo.providers.factory( 'CnFasDataViewFactory', [
    'CnBaseDataViewFactory', 'CnHttpFactory', 'CnModalMessageFactory', 'CnModalConfirmFactory', '$q',
    function( CnBaseDataViewFactory, CnHttpFactory, CnModalMessageFactory, CnModalConfirmFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseDataViewFactory.construct( this, parentModel, root );

        angular.extend( this, {
          submitIntrusion: function( word ) {
            // private method used below
            function sendIntrusion( word ) {
              var data = {};
              if( angular.isString( word ) ) data.word = word;
              else data.word_id = word.id;

              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath(),
                data: data,
                onError: function( response ) {
                  if( 406 == response.status ) {
                    // the word is misspelled
                    return CnModalMessageFactory.instance( {
                      title: 'Misspelled Word',
                      message: 'You have selected a misspelled word. This word cannot be used.'
                    } ).show();
                  } else CnModalMessageFactory.httpError( response );
                }
              } ).post().then( function( response ) {
                self.record.push( response.data );
              } );
            }

            if( angular.isString( word ) ) {
              // remove case and double quotes if they are found at the start/end
              word = word.replace( /^"|"$/g, '' ).toLowerCase();

              // it's a new word, so double-check with the user before proceeding
              return CnModalConfirmFactory.instance( {
                title: 'New Intrusion',
                message: 'The intrusion you have provided, "' + word + '", is not found in the existing list ' +
                         'of words. Please double-check that the spelling is correct before proceeding. ' +
                         'Do not submit the word unless you are sure it is spelled correctly.\n\n' +
                         'Do you wish to submit the intrusion "' + word + '" as a new word?'
              } ).show().then( function( response ) {
                if( response ) return sendIntrusion( word );
              } );
            } else return sendIntrusion( word ); // it's not a new word so send it immediately
          },
          deleteIntrusion: function( wordRecord ) {
            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '/' + wordRecord.id
            } ).delete().then( function() {
              var index = self.record.findIndexByProperty( 'id', wordRecord.id );
              if( null != index ) self.record.splice( index, 1 );
            } );
          }
        } );
      }
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
              order: { 'fas_data.rank': false },
              limit: 10000 // do not limit the number of records returned
            } );
            data.select = { column: [
              { table: 'word', column: 'word' },
              { table: 'language', column: 'code' },
              'word_type'
            ] };
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
