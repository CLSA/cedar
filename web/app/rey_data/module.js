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
    'CnReyDataModelFactory', '$timeout',
    function( CnReyDataModelFactory, $timeout ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?', editEnabled: '=' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnReyDataModelFactory.root;
          $scope.isComplete = false;
          $scope.isWorking = false;
          $scope.model.viewModel.onView().finally( function() { $scope.isComplete = true; } );

          angular.extend( $scope, {
            newWordCache: '',
            submitNewWord: function() {
              if( 0 < $scope.newWord.length ) {
                $scope.isWorking = true;
                $scope.model.viewModel.submitIntrusion( $scope.newWord )
                  .then( function() { $scope.newWord = ''; } )
                  .finally( function() {
                    $scope.isWorking = false;
                    $timeout( function() { document.getElementByIde( 'newWord' ).focus(); }, 20 );
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
                $scope.model.viewModel.onPatch( data ).then( function() {
                  if( 'language_id' == property ) {
                    $scope.model.viewModel.language.name = $scope.model.languageList.findByProperty(
                      'value', $scope.model.viewModel.language.id
                    ).name;
                    $scope.model.viewModel.updateLabelList();
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
            }
          } );
        }
      }
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnReyDataViewFactory', [
    'CnBaseDataViewFactory', 'CnHttpFactory', '$q',
    function( CnBaseDataViewFactory, CnHttpFactory, $q ) {
      var object = function( parentModel, root ) {
        var self = this;
        CnBaseDataViewFactory.construct( this, parentModel, root );
        this.intrusionList = [];
        var baseOnView = this.onView;

        angular.extend( this, {
          submitIntrusion: function( word ) {
            return CnHttpFactory.instance( {
              path: this.parentModel.getServiceResourcePath() + '/word',
              data: { value: word }
            } ).post().then( function( response ) {
              self.intrusionList.push( { id: response.data, word: word } );
            } );
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
                data: { select: { column: [ 'id', 'word' ] } }
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
