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
    river_rey_data_variant_id: { type: 'enum' }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnReyDataView', [
    'CnReyDataModelFactory', 'CnHttpFactory', '$timeout',
    function( CnReyDataModelFactory, CnHttpFactory, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataModelFactory.root;
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
            patch: function( property ) {
              if( $scope.model.getEditEnabled() ) {
                var data = {};
                data[property] = 'language_id' == property
                               ? $scope.model.viewModel.language.id
                               : $scope.model.viewModel.record[property];

                if( 'language_id' == property ) $scope.isComplete = false;
                $scope.model.viewModel.onPatch( data ).then( function() {
                  if( 'language_id' == property ) {
                    $scope.model.viewModel.onView().then( function() { $scope.isComplete = true; } );
                  } else {
                    // All words may only have a boolean value or a variant value, so if we're setting the word
                    // or a variant to anything other than null make sure to empty the other value (the same is
                    // automatically done on the server)
                    if( '' != data[property] ) {
                      var match = property.match( /_rey_data_variant_id/ );
                      var otherProperty = match
                                        ? property.substring( 0, match.index )
                                        : property + '_rey_data_variant_id';
                      $scope.model.viewModel.record[otherProperty] = '';
                    }
                  }
                } );
              }
            },
            getTypeaheadValues: function( viewValue ) {
              $scope.typeaheadIsLoading = true;
              return CnHttpFactory.instance( {
                path: 'word',
                data: {
                  select: { column: [ 'id', 'word', { table: 'language', column: 'code' } ] },
                  modifier: {
                    where: [
                      { column: 'language_id', operator: '=', value: $scope.model.viewModel.language.id },
                      { column: 'misspelled', operator: '=', value: false },
                      { column: 'word', operator: 'LIKE', value: viewValue + '%' }
                    ],
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
  cenozo.providers.factory( 'CnReyDataViewFactory', [
    'CnBaseDataViewFactory',
    'CnModalMessageFactory', 'CnModalConfirmFactory', 'CnModalNewIntrusionFactory',
    'CnHttpFactory', '$q',
    function( CnBaseDataViewFactory,
              CnModalMessageFactory, CnModalConfirmFactory, CnModalNewIntrusionFactory,
              CnHttpFactory, $q ) {
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

            if( angular.isString( word ) ) {
              // remove case and double quotes if they are found at the start/end
              word = word.replace( /^"|"$/g, '' ).toLowerCase();

              // check if the word is one of the REY words
              var label = self.labelList.findByProperty( 'label', word.ucWords() );
              if( label ) {
                return CnModalConfirmFactory.instance( {
                  title: 'Primary Word',
                  message: 'You have selected a primary word which is already listed above.\n' +
                           'Do you want "' + word.ucWords() + '" to be set to Yes?'
                } ).show().then( function( response ) {
                  if( response ) {
                    var data = {};
                    data[label.name] = 1;
                    self.onPatch( data ).then( function() {
                      self.record[label.name] = 1;
                      self.record[label.name + '_rey_data_variant_id'] = '';
                    } );
                  }
                } );
              } else {
                // check if the word is one of the REY variants
                var variant = self.parentModel.variantList.filter( function( obj ) {
                  return obj.language_id == self.language.id;
                } ).findByProperty( 'name', word );
                if( variant ) {
                  return CnModalConfirmFactory.instance( {
                    title: 'Variant Word',
                    message: 'You have selected a variant of the word "' + variant.word + '".\n' +
                             'Do you want "' + variant.word + '" to be set to the variant "' + word + '"?'
                  } ).show().then( function( response ) {
                    if( response ) {
                      var data = {};
                      data[variant.word + '_rey_data_variant_id'] = variant.value;
                      self.onPatch( data ).then( function() {
                        self.record[variant.word + '_rey_data_variant_id'] = variant.value;
                        self.record[variant.word] = '';
                      } );
                    }
                  } );
                }
              }
            }

            // If we get this far then we've either got a word that wasn't caught by the above
            // tests or is a word id (from the typeahead).
            if( angular.isString( word ) ) {
              // it's a new word, so double-check with the user before proceeding
              return CnModalNewIntrusionFactory.instance( {
                word: word,
                language_id: self.parentModel.testEntryModel.viewModel.record.participant_language_id
              } ).show().then( function( response ) { 
                if( null != response ) return sendIntrusion( { language_id: response, word: word } );
              } );
            } else if( self.intrusionList.findByProperty( 'id', word.id ) ) {
              return CnModalMessageFactory.instance( {
                title: 'Intrusion Already Exists',
                message: 'The intrusion you have submitted has already been added to this REY test and does ' +
                         'need to be added multiple times.'
              } ).show();
            } else {
              return sendIntrusion( word ); // it's not a new word so send it immediately
            }
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
              baseOnView(),

              // get the test entry's language (of which there can only be one)
              CnHttpFactory.instance( {
                path: self.parentModel.getServiceCollectionPath().replace( 'rey_data', 'language' ),
                data: { select: { column: [ 'id', 'name' ] } }
              } ).query().then( function( response ) {
                self.language = response.data[0];
                self.updateLabelList();
              } ),

              // get the rey-data intrusions
              CnHttpFactory.instance( {
                path: self.parentModel.getServiceResourcePath() + '/word',
                data: { select: { column: [
                  { table: 'word', column: 'word' },
                  { table: 'language', column: 'code' },
                  'word_type'
                ] } }
              } ).query().then( function( response ) {
                self.intrusionList = response.data;
              } )
            ] );
          },
          updateLabelList: function() {
            if( angular.isDefined( self.language ) && 'French' == self.language.name ) {
              self.labelList = [
                { name: 'drum', label: 'Tambour', },
                { name: 'curtain', label: 'Rideau', },
                { name: 'bell', label: 'Cloche', },
                { name: 'coffee', label: 'Café', },
                { name: 'school', label: 'École', },
                { name: 'parent', label: 'Parent', },
                { name: 'moon', label: 'Lune', },
                { name: 'garden', label: 'Jardin', },
                { name: 'hat', label: 'Chapeau', },
                { name: 'farmer', label: 'Fermier', },
                { name: 'nose', label: 'Nez', },
                { name: 'turkey', label: 'Dinde', },
                { name: 'colour', label: 'Couleur', },
                { name: 'house', label: 'Maison', },
                { name: 'river', label: 'Rivière' }
              ];
            } else {
              self.labelList = [
                { name: 'drum', label: 'Drum', },
                { name: 'curtain', label: 'Curtain', },
                { name: 'bell', label: 'Bell', },
                { name: 'coffee', label: 'Coffee', },
                { name: 'school', label: 'School', },
                { name: 'parent', label: 'Parent', },
                { name: 'moon', label: 'Moon', },
                { name: 'garden', label: 'Garden', },
                { name: 'hat', label: 'Hat', },
                { name: 'farmer', label: 'Farmer', },
                { name: 'nose', label: 'Nose', },
                { name: 'turkey', label: 'Turkey', },
                { name: 'colour', label: 'Colour', },
                { name: 'house', label: 'House', },
                { name: 'river', label: 'River' }
              ];
            }
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
        this.variantList = [];
        this.languageList = [];

        // extend getMetadata
        this.getMetadata = function() {
          return $q.all( [
            this.$$getMetadata(),

            CnHttpFactory.instance( {
              path: 'rey_data_variant',
              data: { select: { column: [ 'id', 'word', 'language_id', 'variant' ] } }
            } ).query().then( function success( response ) {
              response.data.forEach( function( item ) {
                self.variantList.push( {
                  value: item.id,
                  word: item.word,
                  language_id: item.language_id,
                  name: item.variant
                } );
              } );
            } ),

            CnHttpFactory.instance( {
              path: 'language',
              data: {
                select: { column: [ 'id', 'name' ] },
                modifier: { where: { column: 'active', operator: '=', value: true } }
              }
            } ).query().then( function success( response ) {
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
