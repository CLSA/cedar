define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'compound', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'word',
        column: 'word'
      }
    },
    name: {
      singular: 'compound subword',
      plural: 'compound subwords',
      possessive: 'compound subword\'s',
      pluralPossessive: 'compound subwords\''
    },
    columnList: {
      rank: { title: 'Rank', type: 'rank' },
      subword: { column: 'sub_word.word', title: 'Subword' },
      word_id: { column: 'sub_word_id', type: 'hidden' }
    },
    defaultOrder: {
      column: 'compound.rank',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    sub_word_id: {
      title: 'Subword',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'word',
        select: 'CONCAT( word.word, " [", language.code, "]" )',
        where: 'word.word',
        forceEmptyOnNew: true,
        minLength: 1
      }
    },
    rank: {
      title: 'Rank',
      type: 'rank'
    }
  } );

  if( angular.isDefined( module.actions.add ) ) {
    module.addExtraOperation( 'add', {
      title: 'Add Word',
      operation: function( $state, model ) { $state.go( 'word.add' ); }
    } );
  }

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCompoundAdd', [
    'CnCompoundModelFactory',
    function( CnCompoundModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCompoundModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnCompoundList', [
    'CnCompoundModelFactory',
    function( CnCompoundModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnCompoundModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundAddFactory', [
    'CnBaseAddFactory', 'CnHttpFactory', 'CnSession',
    function( CnBaseAddFactory, CnHttpFactory, CnSession ) {
      var object = function( parentModel ) {
        var self = this;
        CnBaseAddFactory.construct( this, parentModel );

        // extend the onNew method to store the parent word's language for use by the word lookup-typeahead
        this.onNew = function( record ) {
          return self.$$onNew( record ).then( function() {
            self.currentParentId = undefined;
            self.currentParentLanguageId = undefined;

            var parentIdentifier = parentModel.getParentIdentifier();
            if( 'word' == parentIdentifier.subject ) {
              var identifier = parentIdentifier.identifier;
              return CnHttpFactory.instance( {
                path: 'word/' + identifier,
                data: { select: { column: [ 'language_id' ] } }
              } ).get().then( function( response ) {
                self.currentParentId = identifier;
                self.currentParentLanguageId = response.data.language_id;
              } );
            }
          } );
        };

        // replace some transition methods since it won't work if we've come from adding a new word
        this.transitionOnCancel = function() {
          this.parentModel.transitionToParentViewState( 'word', this.currentParentId );
        };

        this.transitionOnSave = function( record ) {
          var self = this;
          CnSession.workingTransition( function() {
            self.parentModel.transitionToParentViewState( 'word', self.currentParentId );
          } );
        };
      };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnCompoundModelFactory', [
    'CnBaseModelFactory', 'CnCompoundAddFactory', 'CnCompoundListFactory', '$state',
    function( CnBaseModelFactory, CnCompoundAddFactory, CnCompoundListFactory, $state ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnCompoundAddFactory.instance( this );
        this.listModel = CnCompoundListFactory.instance( this );

        // restrict the subword lookup-typeahead values
        this.getTypeaheadData = function( input, viewValue ) {
          var data = self.$$getTypeaheadData( input, viewValue );
          if( angular.isUndefined( data.modifier.where ) ) data.modifier.where = [];

          // put parentheses around the existing where statement
          if( 0 < data.modifier.where.length ) {
            data.modifier.where.unshift( {
              bracket: true,
              open: true
            } );
            data.modifier.where.push( {
              bracket: true,
              open: false
            } );
          }

          // restrict by language and don't reference the base word
          if( angular.isDefined( self.addModel.currentParentId ) ) {
            data.modifier.where.push( {
              column: 'word.id',
              operator: '!=',
              value: self.addModel.currentParentId
            } );
            data.modifier.where.push( {
              column: 'language_id',
              operator: '=',
              value: self.addModel.currentParentLanguageId
            } );
          }

          // only get words which are not invalid and not misspelled
          data.modifier.where.push( {
            column: 'misspelled',
            operator: '=',
            value: false
          } );
          data.modifier.where.push( {
            column: 'aft',
            operator: '!=',
            value: 'invalid'
          } );
          data.modifier.where.push( {
            column: 'fas',
            operator: '!=',
            value: 'invalid'
          } );

          // and sort by word
          data.modifier.order = { word: false };

          return data;
        };

        // go directly to the word when clicking on a compound
        this.transitionToViewState = function( record ) {
          return $state.go( 'word.view', { identifier: record.word_id } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
