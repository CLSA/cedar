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
    language_code: { column: 'language.code', type: 'hidden' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataView', [
    'CnReyDataModelFactory', 'CnModalMessageFactory', 'CnWordTypeaheadFactory', '$timeout', '$q',
    function( CnReyDataModelFactory, CnModalMessageFactory, CnWordTypeaheadFactory, $timeout, $q ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataModelFactory.root;
          $scope.isComplete = false;
          $scope.isWorking = false;
          $scope.wordTypeaheadTemplateUrl = cenozoApp.getFileUrl( 'cedar', 'word-typeahead-match.tpl.html' );
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          // update which variants are allowed every time the language list changes
          $scope.model.metadata.getPromise().then( function() {
            $scope.$watch( 'model.testEntryModel.viewModel.languageIdList', function( list ) {
              $scope.model.variantList.forEach( function( variant ) {
                variant.allowed = 0 <= list.indexOf( variant.variant_language_id );
              } );
            } );
          } );

          angular.extend( $scope, {
            typeaheadModel: CnWordTypeaheadFactory.instance( {
              getLanguageIdRestrictList: function() {
                return $scope.model.testEntryModel.viewModel.languageIdList;
              }
            } ),
            preventSelectedNewWord: false,
            submitNewWord: function( selected ) {
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
                    CnModalMessageFactory.instance( {
                      title: 'Placeholders Not Allowed',
                      message: 'You cannot use placeholders for the REY test.',
                      error: true
                    } ).show().then( function() { $scope.newWord = ''; } );
                    proceed = false;
                  } else if( !$scope.typeaheadModel.isWordValid( $scope.newWord ) ) {
                    CnModalMessageFactory.instance( {
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
                  $scope.model.viewModel.submitIntrusion( word ).finally( function() {
                    $scope.isWorking = false;
                    $timeout( function() {
                      if( !selected ) $scope.preventSelectedNewWord = false;
                      document.getElementById( 'newWord' ).focus();
                    }, 20 );
                  } );
                }
              }
            },
            deleteWord: function( word ) {
              $scope.isWorking = false;
              $scope.model.viewModel.deleteIntrusion( word ).finally( function() { $scope.isWorking = false; } );
            },
            patch: function( property ) {
              if( $scope.model.getEditEnabled() ) {
                // convert the word-list value into a record value
                var data = {};
                if( 'language_id' == property ) {
                  $scope.isComplete = false;
                  data.language_id = $scope.model.viewModel.record.language_id;
                } else {
                  var variantProperty = property + '_rey_data_variant_id';
                  var wordValue = $scope.model.viewModel.wordList.findByProperty( 'name', property ).value;
                  var match = wordValue.match( /variant([0-9]+)/ );
                  if( null == match ) {
                    data[property] = parseInt( wordValue );
                    data[variantProperty] = null;
                  } else {
                    data[property] = null;
                    data[variantProperty] = parseInt( match[1] );
                  }
                }

                $scope.model.viewModel.onPatch( data ).then( function() {
                  // refresh the view if we've changed the language
                  if( 'language_id' == property )
                    $q.all( [
                      $scope.model.viewModel.onView(),
                      $scope.model.testEntryModel.viewModel.languageModel.listModel.onList( true )
                    ] ).then( function() { $scope.isComplete = true; } );
                } );
              }
            }
          } );
        }
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataViewFactory', [
    'CnBaseDataViewFactory', 'CnModalMessageFactory', 'CnModalNewWordFactory', 'CnHttpFactory', '$q',
    function( CnBaseDataViewFactory, CnModalMessageFactory, CnModalNewWordFactory, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseDataViewFactory.construct( this, parentModel, root );
        this.intrusionList = [];
        var baseOnView = this.onView;

        angular.extend( this, {
          submitIntrusion: function( word ) {
            // private method used below
            function sendIntrusion( input ) {
              var data = { add: angular.isDefined( input.id ) ? input.id : input };

              return CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath() + '/word',
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
                self.intrusionList.push( response.data );
              } );
            }

            // remove case and double quotes if they are found at the start/end
            if( angular.isString( word ) ) word = word.replace( /^"|"$/g, '' ).toLowerCase();

            // split the word up by spaces
            var text = angular.isString( word ) ? word : word.word;
            var tempWordList = text.split( / +/ ).getUnique();
            var newWordList = [];

            // for each sub-word look for REY words and parse them out
            tempWordList.forEach( function( text ) {
              // get unique list of all primary/variant words that match
              var matchList = text.match( self.parentModel.wordRegExp );
              if( null == matchList ) {
                newWordList.push( text );
              } else {
                matchList = matchList.getUnique();

                // convert sister words
                matchList.forEach( function( matchWord, index, array ) {
                  self.parentModel.sisterList.some( function( sisterWord ) {
                    if( 0 <= sisterWord.sisterWordList.indexOf( matchWord ) ) {
                      array[index] = sisterWord.word;
                      return true;
                    }
                  } );
                } );

                // get unique list of all remaining words (removing empty strings)
                newWordList = newWordList.concat(
                  matchList,
                  text.split( self.parentModel.wordOrSpaceRegExp ).filter( function( string ) {
                    return 2 < string.length;
                  } ).getUnique()
                );
              }
            } );

            // if the input was an object, there is only one word in the new list and it matches that object then
            // replace the list with the input word object
            if( angular.isObject( word ) && 1 == newWordList.length && word.word == newWordList[0] )
              newWordList = [ word ];

            // return a collection of all promises resulting from processing each word in the list
            return $q.all( newWordList.reduce( function( promiseList, word ) {
              var text = angular.isString( word ) ? word : word.word;

              // convert sister words
              self.parentModel.sisterList.some( function( sisterWord ) {
                if( 0 <= sisterWord.sisterWordList.indexOf( text ) ) {
                  text = sisterWord.word;
                  return true;
                }
              } );

              // check if the word is one of the REY words
              var label = self.wordList.findByProperty( 'label', text.ucWords() );
              if( label ) {
                var data = {};
                data[label.name] = 1;
                promiseList.push( self.onPatch( data ).then( function() {
                  self.record[label.name] = 1;
                  self.record[label.name + '_rey_data_variant_id'] = '';
                  label.value = 1;
                } ) );
                return promiseList;
              }

              // check if the word is one of the REY variants
              var variant = self.parentModel.variantList.filter( function( obj ) {
                return obj.language_id == self.record.language_id;
              } ).findByProperty( 'name', text );
              if( variant ) {
                if( !variant.allowed ) {
                  promiseList.push( CnModalMessageFactory.instance( {
                    title: 'Variant Not Allowed',
                    message: 'You have selected the variant word "' + text + '" which is currently disabled ' +
                      'because the test-entry has not been identified as using the variant\'s language.\n\n' +
                      'If you wish to select this variant you must enable the relevant language first.'
                  } ).show() );
                } else {
                  var data = {};
                  data[variant.word + '_rey_data_variant_id'] = variant.value;
                  promiseList.push( self.onPatch( data ).then( function() {
                    self.record[variant.word + '_rey_data_variant_id'] = variant.value;
                    self.record[variant.word] = '';
                    self.wordList.findByProperty( 'name', variant.word ).value = 'variant' + variant.value;
                  } ) );
                }
                return promiseList;
              }

              // the word is neither a REY primary or variant, so send it as a new word
              if( angular.isString( word ) ) {
                // it's a new word, so double-check with the user before proceeding
                promiseList.push( CnModalNewWordFactory.instance( {
                  word: word,
                  language_id: self.record.language_id,
                  languageIdRestrictList: self.parentModel.testEntryModel.viewModel.languageIdList
                } ).show().then( function( response ) {
                  if( null != response ) {
                    // make sure the intrusion doesn't already exist
                    return self.intrusionList.some( function( intrusion ) {
                      return intrusion.language_id == response && intrusion.word == word;
                    } ) ? CnModalMessageFactory.instance( {
                      title: 'Intrusion Already Exists',
                      message: 'The intrusion you have submitted has already been added to this REY test and does ' +
                               'need to be added multiple times.'
                    } ).show() : sendIntrusion( { language_id: response, word: word } );
                  }
                } ) );
              } else if( self.intrusionList.findByProperty( 'id', word.id ) ) {
                promiseList.push( CnModalMessageFactory.instance( {
                  title: 'Intrusion Already Exists',
                  message: 'The intrusion you have submitted has already been added to this REY test and does ' +
                           'need to be added multiple times.'
                } ).show() );
              } else {
                promiseList.push( sendIntrusion( word ) ); // it's not a new word so send it immediately
              }

              return promiseList;
            }, [] ) );
          },
          deleteIntrusion: function( wordRecord ) {
            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '/word/' + wordRecord.id
            } ).delete().then( function() {
              var index = self.intrusionList.findIndexByProperty( 'id', wordRecord.id );
              if( null != index ) self.intrusionList.splice( index, 1 );
            } );
          },
          onView: function() {
            return $q.all( [
              baseOnView().then( self.updateLabelList ),

              // get the rey-data intrusions
              CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath() + '/word',
                data: { select: { column: [
                  { table: 'word', column: 'word' },
                  { table: 'language', column: 'code' },
                  'language_id',
                  'word_type'
                ] } }
              } ).query().then( function( response ) {
                self.intrusionList = response.data;
              } )
            ] );
          },
          updateLabelList: function() {
            if( 'fr' == self.record.language_code ) {
              self.wordList = [
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
              self.wordList = [
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

            self.wordList.forEach( function( word ) {
              var variantProperty = word.name + '_rey_data_variant_id';
              if( Number.isInteger( self.record[word.name] ) ) word.value = self.record[word.name];
              else if( Number.isInteger( self.record[variantProperty] ) )
                word.value = 'variant' + self.record[variantProperty];
            } );
          }
        } );
      }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataModelFactory', [
    'CnBaseDataModelFactory', 'CnReyDataViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseDataModelFactory, CnReyDataViewFactory, CnHttpFactory, $q ) {
      var object = function( root, testEntryModel ) {
        var self = this;
        CnBaseDataModelFactory.construct( this, module );
        this.viewModel = CnReyDataViewFactory.instance( this, root );
        this.testEntryModel = testEntryModel;
        this.wordRegExp = null;
        this.wordOrSpaceRegExp = null;
        this.sisterList = [];
        this.variantList = [];
        this.languageList = [];

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [
            this.$$getMetadata(),

            CnHttpFactory.instance( {
              path: 'word?rey_words=1',
              data: { select: { column: [ 'id', 'word', 'sister_list' ] } }
            } ).query().then( function( response ) {
              response.data.forEach( function( item ) {
                self.sisterList.push( {
                  id: item.id,
                  word: item.word,
                  sisterWordList: null == item.sister_list ? [] : item.sister_list.split( ',' )
                } );
              } );

              // build the regular expressions that matches any primary, variant or sister word
              var regString = '';
              self.sisterList.forEach( function( sisterWord ) {
                if( 0 < regString.length ) regString += '|';
                sisterWord.sisterWordList.forEach( function( sister ) {
                  regString += '^' + sister + '|' + sister + '$';
                } );
                regString += '^' + sisterWord.word + '|' + sisterWord.word + '$';
              } );
              self.wordRegExp = new RegExp( regString, 'gi' );
              self.wordOrSpaceRegExp = new RegExp( regString + '| +', 'gi' );
            } ),

            CnHttpFactory.instance( {
              path: 'rey_data_variant',
              data: {
                select: {
                  column: [ 'id', 'word', 'language_id',
                    { table: 'variant', column: 'word', alias: 'variant' },
                    { table: 'variant', column: 'language_id', alias: 'variant_language_id' }
                  ]
                }
              }
            } ).query().then( function( response ) {
              response.data.forEach( function( item ) {
                self.variantList.push( {
                  value: item.id,
                  word: item.word,
                  language_id: item.language_id,
                  name: item.variant,
                  variant_language_id: item.variant_language_id,
                  allowed: false
                } );
              } );
            } ),

            CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { where: { column: 'active', operator: '=', value: true } }
              }
            } ).query().then( function( response ) {
              response.data.forEach( function( item ) {
                self.languageList.push( { value: item.id, name: item.name } );
              } );
            } )

          ] );
        };
      };

      return {
        root: new object( true ),
        instance: function( testEntryModel ) { return new object( false, testEntryModel ); }
      };
    }
  ] );

} );
