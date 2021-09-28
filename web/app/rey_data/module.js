define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'rey_data', true ); } catch( err ) { console.warn( err ); return; }
  cenozoApp.initDataModule( module, 'REY' );
  module.addInputGroup( '', {
    drum: { type: 'boolean' },
    drum_rey_data_variant_id: { type: 'enum' },
    curtain: { type: 'boolean' },
    curtain_rey_data_variant_id: { type: 'enum' },
    bell: { type: 'boolean' },
    bell_rey_data_variant_id: { type: 'enum' },
    coffee: { type: 'boolean' },
    coffee_rey_data_variant_id: { type: 'enum' },
    school: { type: 'boolean' },
    school_rey_data_variant_id: { type: 'enum' },
    parent: { type: 'boolean' },
    parent_rey_data_variant_id: { type: 'enum' },
    moon: { type: 'boolean' },
    moon_rey_data_variant_id: { type: 'enum' },
    garden: { type: 'boolean' },
    garden_rey_data_variant_id: { type: 'enum' },
    hat: { type: 'boolean' },
    hat_rey_data_variant_id: { type: 'enum' },
    farmer: { type: 'boolean' },
    farmer_rey_data_variant_id: { type: 'enum' },
    nose: { type: 'boolean' },
    nose_rey_data_variant_id: { type: 'enum' },
    turkey: { type: 'boolean' },
    turkey_rey_data_variant_id: { type: 'enum' },
    colour: { type: 'boolean' },
    colour_rey_data_variant_id: { type: 'enum' },
    house: { type: 'boolean' },
    house_rey_data_variant_id: { type: 'enum' },
    river: { type: 'boolean' },
    river_rey_data_variant_id: { type: 'enum' },
    language_id: { type: 'enum' },
    language_code: { column: 'language.code', type: 'hidden' },
    language_name: { column: 'language.name', type: 'hidden' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataView', [
    'CnReyDataModelFactory', 'CnModalMessageFactory', 'CnWordTypeaheadFactory', '$timeout',
    function( CnReyDataModelFactory, CnModalMessageFactory, CnWordTypeaheadFactory, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: async function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataModelFactory.root;

          angular.extend( $scope, {
            isComplete: false,
            isWorking: false,
            wordTypeaheadTemplateUrl: cenozoApp.getFileUrl( 'cedar', 'word-typeahead-match.tpl.html' ),
            typeaheadModel: CnWordTypeaheadFactory.instance( {
              getLanguageIdRestrictList: function() {
                return $scope.model.testEntryModel.viewModel.languageIdList;
              }
            } ),
            preventSelectedNewWord: false,
            submitNewWord: async function( selected ) {
              // string if it's a new word, integer if it's an existing intrusion
              if( angular.isObject( $scope.newWord ) ||
                  ( null == $scope.typeaheadModel.lastGUID && 0 < $scope.newWord.length ) ) {
                // prevent double-entry from enter key and typeahead selection
                var proceed = true;
                if( !selected ) $scope.preventSelectedNewWord = true;
                else if( $scope.preventSelectedNewWord ) proceed = false;

                if( proceed && angular.isString( $scope.newWord ) ) {
                  // get rid of en- and em-dashes
                  $scope.newWord = $scope.newWord.toLowerCase().replace( /[—–]/g, '-' );
                  if( $scope.newWord.match( /^-+$/ ) ) {
                    await CnModalMessageFactory.instance( {
                      title: 'Placeholders Not Allowed',
                      message: 'You cannot use placeholders for the REY test.',
                      error: true
                    } ).show()
                    $scope.newWord = '';
                    proceed = false;
                  } else if( !$scope.typeaheadModel.isWordValid( $scope.newWord ) ) {
                    await CnModalMessageFactory.instance( {
                      title: 'Invalid Word',
                      message: 'The word you have provided is invalid.\n\n' +
                               'Please enter a word at least two characters long using only letters, ' +
                               'single-quotes (\'), dashes (-) and spaces, and which starts with at ' +
                               'least one alphabetic letter.',
                      error: true
                    } ).show();
                    proceed = false;
                  }
                }

                if( proceed ) {
                  var word = $scope.newWord;
                  if( angular.isUndefined( selected ) ) selected = false;
                  if( angular.isString( word ) && null != word.match( /^-+$/ ) ) word = { id: null };
                  $scope.newWord = '';
                  try {
                    await $scope.model.viewModel.submitIntrusion( word );
                  } finally {
                    $scope.isWorking = false;
                    await $timeout( function() {
                      if( !selected ) $scope.preventSelectedNewWord = false;
                      document.getElementById( 'newWord' ).focus();
                    }, 20 );
                  }
                }
              }
            },
            deleteWord: async function( word ) {
              $scope.isWorking = false;
              try {
                await $scope.model.viewModel.deleteIntrusion( word );
              } finally {
                $scope.isWorking = false;
              }
            },
            patch: async function( property ) {
              if( $scope.model.getEditEnabled() ) {
                // convert the word-list value into a record value
                var data = {};
                if( 'language_id' == property ) {
                  $scope.isComplete = false;
                  data.language_id = $scope.model.viewModel.record.language_id;
                } else {
                  var variantProperty = property + '_rey_data_variant_id';
                  var wordValue = $scope.model.viewModel.wordList.findByProperty( 'name', property ).value;
                  if( angular.isNumber( wordValue ) ) {
                    data[property] = parseInt( wordValue );
                    data[variantProperty] = null;
                  } else {
                    var match = wordValue.match( /variant([0-9]+)/ );
                    data[property] = null;
                    data[variantProperty] = parseInt( match[1] );
                  }
                }

                await $scope.model.viewModel.onPatch( data );

                // refresh the view if we've changed the language
                if( 'language_id' == property ) {
                  try {
                    await $scope.model.viewModel.onView();
                    await $scope.model.testEntryModel.viewModel.languageModel.listModel.onList( true );
                  } finally {
                    $scope.isComplete = true;
                  }
                } else {
                  $scope.model.viewModel.record[property] = null == data[property] ? '' : data[property];
                  $scope.model.viewModel.record[variantProperty] = null == data[variantProperty] ? '' : data[variantProperty];
                }
              }
            }
          } );

          try {
            await $scope.model.viewModel.onView();
          } finally {
            $scope.isComplete = true;
          }

          // update language and which variants are allowed every time the language list changes
          await $scope.model.metadata.getPromise();
          $scope.$watch( 'model.testEntryModel.viewModel.languageIdList', function( list ) {
            $scope.model.viewModel.onView();
            $scope.model.variantList.forEach( function( variant ) {
              variant.allowed = list.includes( variant.variant_language_id );
            } );
          } );
        }
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataViewFactory', [
    'CnBaseDataViewFactory', 'CnModalMessageFactory', 'CnModalConfirmFactory', 'CnModalNewWordFactory', 'CnHttpFactory',
    function( CnBaseDataViewFactory, CnModalMessageFactory, CnModalConfirmFactory, CnModalNewWordFactory, CnHttpFactory ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseDataViewFactory.construct( this, parentModel, root );
        this.baseOnViewFn = this.onView;

        angular.extend( this, {
          intrusionList: [],
          submitIntrusion: async function( word ) {
            var quoteEnclosed = false;
            if( angular.isString( word ) ) {
              // convert to lower case
              word = word.toLowerCase();

              // words enclosed in double-quotes are never modified
              var quoteMatch = word.match( /^"(.*)"$/ );
              if( null != quoteMatch ) {
                word = quoteMatch[1];
                quoteEnclosed = true;
              }
            }

            var newWordList = [];
            if( quoteEnclosed ) {
              // do not modify input that was enclosed by double-quotes
              newWordList.push( word );
            } else {
              // split the word up by spaces
              var text = angular.isString( word ) ? word : word.word;
              text.split( / +/ ).getUnique().forEach( function( text ) {
                // check if the word is a sister word and convert to the parent if so
                self.parentModel.sisterList.some( function( sisterWord ) {
                  if( sisterWord.sisterWordList.includes( text ) ) {
                    text = sisterWord.word;
                    return true;
                  }
                } );
                newWordList.push( text );
              } );
            }

            // If the input was an object, there is only one word in the new list and it matches that object then replace
            // the list with the input word object
            if( angular.isObject( word ) && 1 == newWordList.length && word.word == newWordList[0] ) newWordList = [ word ];

            await Promise.all( newWordList.map( async function( word ) {
              var text = angular.isString( word ) ? word : word.word;

              // convert sister words
              self.parentModel.sisterList.some( function( sisterWord ) {
                if( sisterWord.sisterWordList.includes( text ) ) {
                  text = sisterWord.word;
                  return true;
                }
              } );

              // check if the word is one of the REY words
              var label = self.wordList.findByProperty( 'label', text.ucWords() );
              if( label ) {
                var data = {};
                data[label.name] = 1;
                await self.onPatch( data );
                self.record[label.name] = 1;
                self.record[label.name + '_rey_data_variant_id'] = '';
                label.value = 1;
              } else {
                // check if the word is one of the REY variants
                var variant = self.parentModel.variantList.filter( function( obj ) {
                  return obj.language_id == self.record.language_id;
                } ).findByProperty( 'name', text );

                if( variant ) {
                  if( !variant.allowed ) {
                    await CnModalMessageFactory.instance( {
                      title: 'Variant Not Allowed',
                      message: 'You have selected the variant word "' + text + '" which is currently disabled ' +
                        'because the test-entry has not been identified as using the variant\'s language.\n\n' +
                        'If you wish to select this variant you must enable the relevant language first.'
                    } ).show();
                  } else {
                    var data = {};
                    data[variant.word + '_rey_data_variant_id'] = variant.value;
                    await self.onPatch( data );
                    self.record[variant.word + '_rey_data_variant_id'] = variant.value;
                    self.record[variant.word] = '';
                    self.wordList.findByProperty( 'name', variant.word ).value = 'variant' + variant.value;
                  }
                } else {
                  // the word is neither a REY primary or variant, so send it as a new word
                  var alreadyExists = false;
                  var sendIntrusion = true;
                  if( angular.isString( word ) ) {
                    sendIntrusion = false;

                    // it's a new word, so double-check with the user before proceeding
                    var response = await CnModalNewWordFactory.instance( {
                      word: word,
                      language_id: self.record.language_id,
                      languageIdRestrictList: self.parentModel.testEntryModel.viewModel.languageIdList
                    } ).show();

                    if( null != response ) {
                      // make sure the intrusion doesn't already exist
                      if( self.intrusionList.some( function( intrusion ) {
                        return intrusion.language_id == response && intrusion.word == word;
                      } ) ) {
                        alreadyExists = true;
                      } else {
                        word = { language_id: response, word: word };
                        sendIntrusion = true;
                      }
                    }
                  }

                  if( alreadyExists || self.intrusionList.findByProperty( 'id', word.id ) ) {
                    await CnModalMessageFactory.instance( {
                      title: 'Intrusion Already Exists',
                      message: 'The intrusion you have submitted has already been added to this REY test and does ' +
                               'need to be added multiple times.'
                    } ).show();
                  } else if( sendIntrusion ) {
                    var data = { add: angular.isDefined( word.id ) ? word.id : word };

                    var response = await CnHttpFactory.instance( {
                      path: self.parentModel.getServiceResourcePath() + '/word',
                      data: data,
                      onError: function( error ) {
                        if( 406 == error.status ) {
                          // the word is misspelled
                          return CnModalMessageFactory.instance( {
                            title: 'Misspelled Word',
                            message: 'You have selected a misspelled word. This word cannot be used.'
                          } ).show();
                        } else CnModalMessageFactory.httpError( error );
                      }
                    } ).post();
                    self.intrusionList.push( response.data );
                  }
                }
              }
            } ) );
          },
          deleteIntrusion: async function( wordRecord ) {
            await CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '/word/' + wordRecord.id
            } ).delete();

            var index = this.intrusionList.findIndexByProperty( 'id', wordRecord.id );
            if( null != index ) this.intrusionList.splice( index, 1 );
          },
          setRemainingWordsAsNo: async function() {
            if( this.parentModel.getEditEnabled() ) {
              // convert the word-list value into a record value
              var data = {};
              this.wordList.forEach( function( word ) {
                var property = word.name;
                var variantProperty = property + '_rey_data_variant_id';
                if( "" === self.record[property] && "" === self.record[variantProperty] ) data[word.name] = 0;
              } );

              await this.onPatch( data );

              for( var property in data ) {
                this.record[property] = 0;
                this.wordList.findByProperty( 'name', property ).value = 0;
              }
            }
          },
          onView: async function() {
            var object = this;
            await this.baseOnViewFn();

            if( 'fr' == this.record.language_code ) {
              this.wordList = [
                { name: 'drum', label: 'Tambour', value: null },
                { name: 'curtain', label: 'Rideau', value: null },
                { name: 'bell', label: 'Cloche', value: null },
                { name: 'coffee', label: 'Café', value: null },
                { name: 'school', label: 'École', value: null },
                { name: 'parent', label: 'Parent', value: null },
                { name: 'moon', label: 'Lune', value: null },
                { name: 'garden', label: 'Jardin', value: null },
                { name: 'hat', label: 'Chapeau', value: null },
                { name: 'farmer', label: 'Fermier', value: null },
                { name: 'nose', label: 'Nez', value: null },
                { name: 'turkey', label: 'Dinde', value: null },
                { name: 'colour', label: 'Couleur', value: null },
                { name: 'house', label: 'Maison', value: null },
                { name: 'river', label: 'Rivière', value: null }
              ];
            } else {
              this.wordList = [
                { name: 'drum', label: 'Drum', value: null },
                { name: 'curtain', label: 'Curtain', value: null },
                { name: 'bell', label: 'Bell', value: null },
                { name: 'coffee', label: 'Coffee', value: null },
                { name: 'school', label: 'School', value: null },
                { name: 'parent', label: 'Parent', value: null },
                { name: 'moon', label: 'Moon', value: null },
                { name: 'garden', label: 'Garden', value: null },
                { name: 'hat', label: 'Hat', value: null },
                { name: 'farmer', label: 'Farmer', value: null },
                { name: 'nose', label: 'Nose', value: null },
                { name: 'turkey', label: 'Turkey', value: null },
                { name: 'colour', label: 'Colour', value: null },
                { name: 'house', label: 'House', value: null },
                { name: 'river', label: 'River', value: null }
              ];
            }

            this.wordList.forEach( function( word ) {
              var variantProperty = word.name + '_rey_data_variant_id';
              if( Number.isInteger( self.record[word.name] ) ) word.value = self.record[word.name];
              else if( Number.isInteger( self.record[variantProperty] ) )
                word.value = 'variant' + self.record[variantProperty];
            } );

            // get the rey-data intrusions
            var response = await CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '/word',
              data: { select: { column: [
                { table: 'word', column: 'word' },
                { table: 'language', column: 'code' },
                'language_id',
                'word_type'
              ] } }
            } ).query();
            this.intrusionList = response.data;
          },
          checkBeforeSubmit: async function() {
            // show a warning if all variants are of the opposite language to the test

            // first count the number of variants used and how many are of the test's language
            var variantCount = 0;
            var languageCount = 0;
            this.wordList.forEach( function( word ) {
              var property = word.name + '_rey_data_variant_id';
              if( self.record[property] ) {
                variantCount++;
                var variant = self.parentModel.variantList.findByProperty( 'value', self.record[property] );
                if( variant.variant_language_id == self.record.language_id ) languageCount++;
              }
            } );

            // if there are at least 2 variants and none of the variants are in the same language as the test show a warning
            var response = true;
            if( 0 == languageCount && 1 < variantCount ) {
              var response = await CnModalConfirmFactory.instance( {
                title: 'WARNING: Language Mismatch',
                message:
                  'Are you sure that the REY test was administered in ' + this.record.language_name + '?\n\n' +
                  'None of the selected variant words are in ' + this.record.language_name + ', ' +
                  'however the test is currently set to that language. ' +
                  'If you believe the test was not administered in ' + this.record.language_name + ' ' +
                  'then cancel this submission and change the language before re-submitting.'
              } ).show();
            }

            return response;
          }
        } );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataModelFactory', [
    'CnBaseDataModelFactory', 'CnReyDataViewFactory', 'CnHttpFactory',
    function( CnBaseDataModelFactory, CnReyDataViewFactory, CnHttpFactory ) {
      var object = function( root, testEntryModel ) {
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnReyDataViewFactory.instance( this, root );
        this.testEntryModel = testEntryModel;
        this.fullWordList = [];
        this.sisterList = [];
        this.variantList = [];
        this.languageList = [];

        // extend getMetadata
        var self = this;
        this.getMetadata = async function() {
          await this.$$getMetadata();

          var [wordResponse, reyDataVariantResponse, languageResponse] = await Promise.all( [
            CnHttpFactory.instance( {
              path: 'word?rey_words=1',
              data: {
                select: { column: [ 'id', 'word', 'sister_list' ] },
                modifier: { limit: 1000 }
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'rey_data_variant',
              data: {
                select: {
                  column: [ 'id', 'word', 'language_id',
                    { table: 'variant', column: 'word', alias: 'variant' },
                    { table: 'variant', column: 'language_id', alias: 'variant_language_id' }
                  ]
                },
                modifier: { limit: 1000 }
              }
            } ).query(),

            CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { where: { column: 'active', operator: '=', value: true }, limit: 1000 }
              }
            } ).query()
          ] );

          wordResponse.data.forEach( function( item ) {
            self.sisterList.push( {
              id: item.id,
              word: item.word,
              sisterWordList: null == item.sister_list ? [] : item.sister_list.split( ',' )
            } );
          } );

          // build a list of all primary, variant and sister words
          this.sisterList.forEach( function( sisterWord ) {
            sisterWord.sisterWordList.forEach( sister => self.fullWordList.push( sister ) );
            self.fullWordList.push( sisterWord.word );
          } );

          reyDataVariantResponse.data.forEach( function( item ) {
            self.variantList.push( {
              value: item.id,
              word: item.word,
              language_id: item.language_id,
              name: item.variant,
              variant_language_id: item.variant_language_id,
              allowed: false
            } );
          } );

          languageResponse.data.forEach( function( item ) {
            self.languageList.push( { value: item.id, name: item.name } );
          } );
        };
      };

      return {
        root: new object( true ),
        instance: function( testEntryModel ) { return new object( false, testEntryModel ); }
      };
    }
  ] );

} );
