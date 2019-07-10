define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'word', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'word',
      plural: 'words',
      possessive: 'word\'s'
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
      animal_code: {
        column: 'word.animal_code',
        title: 'Animal Code'
      },
      sister_word: {
        column: 'sister_word.word',
        title: 'Parent Sister'
      },
      compound_count: {
        title: 'Compounds',
        type: 'number'
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
      aft_total: {
        column: 'word_test_type_total.aft_total',
        title: '#AFT',
        type: 'number'
      },
      fas_total: {
        column: 'word_test_type_total.fas_total',
        title: '#FAS',
        type: 'number'
      },
      rey_total: {
        column: 'word_test_type_total.rey_total',
        title: '#REY',
        type: 'number'
      },
      update_timestamp: {
        column: 'word.update_timestamp',
        title: 'Timestamp',
        type: 'datetime'
      }
    },
    defaultOrder: {
      column: 'word.word',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    language_id: {
      title: 'Language',
      type: 'enum',
      constant: 'view'
    },
    word: {
      title: 'Word',
      type: 'string',
      constant: 'view'
    },
    animal_code: {
      title: 'Animal Code',
      type: 'string',
      // regex is exactly 7 integers >= 0 delimited by a period (.)
      regex: '^([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)$'
    },
    sister_word_id: {
      title: 'Parent Sister Word',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'word',
        select: 'CONCAT( word.word, " [", language.code, "]" )',
        where: 'word.word',
        modifier: { where: [
          { column: 'word.fas', operator: '!=', value: 'invalid' },
          { column: 'word.sister_word_id', operator: '=', value: null }
        ] }
      },
      constant: 'view' // changed in the model below
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
    description: {
      title: 'Description',
      type: 'text'
    }
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
    'CnBaseViewFactory', 'CnModalMessageFactory', 'CnModalSelectWordFactory', 'CnModalTextFactory',
    'CnSession', 'CnHttpFactory', '$q',
    function( CnBaseViewFactory, CnModalMessageFactory, CnModalSelectWordFactory, CnModalTextFactory,
              CnSession, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseViewFactory.construct( this, parentModel, root );
        this.lastMisspelledValue = null;
        this.lastAftValue = null;
        this.lastFasValue = null;
        this.sisterWordLastPatched = false;

        // disable the choosing of test-entries using this word
        this.deferred.promise.then( function() {
          if( angular.isDefined( self.testEntryModel ) )
            self.testEntryModel.getChooseEnabled = function() { return false; };
        } );

        this.onView = function( force ) {
          return $q.all( [
            // do not allow compounded words to have a parent sister word
            CnHttpFactory.instance( {
              path: self.parentModel.getServiceResourcePath() + '/compound'
            } ).count().then( function( response ) {
              var mainInputGroup = self.parentModel.module.inputGroupList.findByProperty( 'title', '' );
              mainInputGroup.inputList.sister_word_id.constant = 0 < parseInt( response.headers( 'Total' ) ) ? 'view' : false;
            } ),
            
            // do not allow words to be edited by non-admins once misspelled, aft and fas has been defined
            this.$$onView( force ).then( function() {
              self.parentModel.getEditEnabled = function() {
                return self.parentModel.$$getEditEnabled() && (
                  'administrator' == CnSession.role.name ||
                  '' === self.record.mispelled ||
                  '' === self.record.aft ||
                  '' === self.record.fas
                );
              }
            } )
          ] );
        };

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

          self.sisterWordLastPatched = angular.isDefined( data.sister_word_id );

          if( true == data.misspelled || 'invalid' == data.aft || 'invalid' == data.fas ) {
            var which = 'invalid' == data.aft
                      ? ( 'invalid' == this.record.fas ? 'All AFT and REY' : 'All AFT' )
                      : 'invalid' == data.fas
                      ? ( 'invalid' == this.record.aft ? 'All FAS and REY' : 'All FAS' )
                      : 'All';
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
                      if( true == data.misspelled ) {
                        self.record.aft = 'invalid';
                        self.record.fas = 'invalid';
                      }
                      
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
            } else if( angular.isDefined( data.animal_code ) ) {
              if( 0 == data.animal_code.length ) {
                if( 'primary' == self.record.aft ) self.record.aft = '';
              } else {
                self.record.aft = 'primary';
              }
            }
          } );
        };

        // reset the formatted sister word if there is a problem
        this.onPatchError = function( response ) {
          this.$$onPatchError( response );
          if( 306 == response.status &&
              angular.isDefined( response.config.data.sister_word_id ) ) {
            this.formattedRecord.sister_word_id = this.backupRecord.formatted_sister_word_id;
          }
        };

        // warn if the new sister word is an intrusion
        this.afterPatch( function() {
          if( self.sisterWordLastPatched ) {
            if( self.record.sister_word_id ) {
              CnHttpFactory.instance( {
                path: 'word/' + self.record.sister_word_id,
                data: { select: { column: 'fas' } }
              } ).get().then( function( response ) {
                if( 'intrusion' == response.data.fas ) {
                  CnModalMessageFactory.instance( {
                    title: 'Parent Sister Word is Intrusion',
                    message: 'Warning, the parent sister word you have selected is an FAS intrusion. ' +
                      'Please check to make sure you have selected the correct parent sister word.'
                  } ).show();
                }
              } );
            }
            self.sisterWordLastPatched = false;
          }
        } );
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

        // extend getMetadata
        this.getMetadata = function() {
          return this.$$getMetadata().then( function() {
            return CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { where: { column: 'active', operator: '=', value: true }, order: { name: false } }
              }
            } ).query().then( function success( response ) {
              self.metadata.columnList.language_id.enumList = [];
              response.data.forEach( function( item ) {
                self.metadata.columnList.language_id.enumList.push( { value: item.id, name: item.name } );
              } );
            } );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
