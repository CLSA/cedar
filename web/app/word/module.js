define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'word', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'word',
      plural: 'words',
      possessive: 'word\'s',
      pluralPossessive: 'words\''
    },
    columnList: {
      language: {
        column: 'language.name',
        title: 'Language'
      },
      word: {
        column: 'word.word',
        title: 'Word'
      },
      animal_word: {
        column: 'animal_word.word',
        title: 'Parent Animal'
      },
      sister_word: {
        column: 'sister_word.word',
        title: 'Parent Sister'
      },
      misspelled: {
        column: 'word.misspelled',
        title: 'Misspelled',
        type: 'boolean'
      },
      aft: {
        column: 'word.aft',
        title: 'AFT Type'
      },
      fas: {
        column: 'word.fas',
        title: 'FAS Type'
      },
      test_entry_count: {
        title: 'Used',
        type: 'number'
      }
    },
    defaultOrder: {
      column: 'word.word',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    language: {
      column: 'language.name',
      title: 'Language',
      type: 'string',
      constant: true
    },
    word: {
      title: 'Word',
      type: 'string',
      constant: true
    },
    animal_word_id: {
      title: 'Parent Animal Word',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'word',
        select: 'CONCAT( word.word, " [", language.code, "]" )',
        where: 'word.word'
      }
    },
    sister_word_id: {
      title: 'Parent Sister Word',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'word',
        select: 'CONCAT( word.word, " [", language.code, "]" )',
        where: 'word.word'
      }
    },
    misspelled: {
      title: 'Misspelled',
      type: 'boolean'
    },
    aft: {
      title: 'AFT Type',
      type: 'enum'
    },
    fas: {
      title: 'FAS Type',
      type: 'enum'
    },
    language_id: { type: 'hidden' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWordAdd', [
    'CnWordModelFactory',
    function( CnWordModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnWordModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWordList', [
    'CnWordModelFactory',
    function( CnWordModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnWordModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnWordView', [
    'CnWordModelFactory',
    function( CnWordModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnWordModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordViewFactory', [
    'CnBaseViewFactory', 'CnModalSelectWordFactory', 'CnModalTextFactory', '$q',
    function( CnBaseViewFactory, CnModalSelectWordFactory, CnModalTextFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );
        this.lastMisspelledValue = null;
        this.lastAftValue = null;
        this.lastFasValue = null;

        // disable the choosing of test-entries using this word
        this.deferred.promise.then( function() {
          if( angular.isDefined( self.testEntryModel ) )
            self.testEntryModel.getChooseEnabled = function() { return false; };
        } );

        this.onPatch = function( data ) {
          function undoChange( data ) {
            if( true == data.misspelled ) {
              self.record.misspelled =
                null == self.lastMisspelledValue ? self.backupRecord.misspelled : self.lastMisspelledValue;
            } else if( 'invalid' == data.aft ) {
              self.record.aft = null == self.lastAftValue ? self.backupRecord.aft : self.lastAftValue;
            } else if( 'invalid' == data.fas ) {
              self.record.fas = null == self.lastFasValue ? self.backupRecord.fas : self.lastFasValue;
            }
          }

          if( true == data.misspelled || 'invalid' == data.aft || 'invalid' == data.fas ) {
            var which = 'invalid' == data.aft ? 'All AFT' : 'invalid' == data.fas ? 'All FAS' : 'All';
            var promise = true == data.misspelled
                        ? CnModalSelectWordFactory.instance( {
                            message:
                              'Please select the correct spelling for this word.\n\n' +
                              'If you provide a word then all test-entries using the misspelled word will be ' +
                              'changed to the selected word. You may leave the replacement word blank if you do ' +
                              'want test-entries to be affected.',
                            languageIdRestrictList: [ self.record.language_id ]
                          } ).show()
                        : $q.all().then( function() { return undefined; } );
            
            return promise.then( function( response ) {
              if( angular.isDefined( response ) && null == response ) {
                undoChange( data );
              } else {
                if( angular.isDefined( response ) ) data.correct_word = response;

                // get a message to leave in test-entries using this word
                return CnModalTextFactory.instance( {
                  title: 'Test Entry Note',
                  message: which + ' test entries using this word will be re-assigned to the last user that ' +
                           'it was assigned to.  Please provide a note that will be added to these test-entries:',
                  text: 'The ' + self.record.language + ' word "' + self.record.word + '" which is used by ' +
                        'this test-entry has been marked as invalid. Please replace this word with another ' +
                        'valid word and re-submit.',
                  minLength: 10
                } ).show().then( function( response ) {
                  if( !response ) {
                    undoChange( data );
                  } else {
                    data.note = response;
                    return self.$$onPatch( data ).then( function() {
                      // setting misspelled to true means aft and fas must be invalid
                      self.record.aft = 'invalid';
                      self.record.fas = 'invalid';
                      
                      // if a note was added then the test-entry list may have changed
                      if( angular.isDefined( self.testEntryModel ) ) self.testEntryModel.listModel.onList( true );
                    } );
                  }
                } );
              }
            } );
          }

          // if we get here then we're not setting misspelled to true
          return self.$$onPatch( data ).then( function() {
            if( angular.isDefined( data.misspelled ) ) {
              self.lastMisspelledValue = data.misspelled;
              self.lastAftValue = data.aft;
              self.lastFasValue = data.fas;
            } else if( 'intrusion' == data.aft || 'primary' == data.aft ||
                       'intrusion' == data.fas || 'primary' == data.fas ) {
              // setting aft or fas to intrusion or primary means the word cannot be misspelled
              self.record.misspelled = false;
            }
          } );
        };
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnWordModelFactory', [
    'CnBaseModelFactory',
    'CnWordAddFactory', 'CnWordListFactory', 'CnWordViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory,
              CnWordAddFactory, CnWordListFactory, CnWordViewFactory, CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnWordAddFactory.instance( this );
        this.listModel = CnWordListFactory.instance( this );
        this.viewModel = CnWordViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
