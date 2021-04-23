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
      possessive: 'compound subword\'s'
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
      operation: async function( $state, model ) { await $state.go( 'word.add' ); }
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
        CnBaseAddFactory.construct( this, parentModel );

        // extend the onNew method to store the parent word's language for use by the word lookup-typeahead
        this.onNew = async function( record ) {
          await this.$$onNew( record );

          this.currentParentId = undefined;
          this.currentParentLanguageId = undefined;

          var parentIdentifier = parentModel.getParentIdentifier();
          if( 'word' == parentIdentifier.subject ) {
            var identifier = parentIdentifier.identifier;
            var response = CnHttpFactory.instance( {
              path: 'word/' + identifier,
              data: { select: { column: [ 'language_id' ] } }
            } ).get();

            this.currentParentId = identifier;
            this.currentParentLanguageId = response.data.language_id;
          }
        };

        // replace some transition methods since it won't work if we've come from adding a new word
        this.transitionOnCancel = function() {
          this.parentModel.transitionToParentViewState( 'word', this.currentParentId );
        };

        this.transitionOnSave = async function( record ) {
          var self = this;
          await CnSession.workingTransition( async function() {
            await self.parentModel.transitionToParentViewState( 'word', self.currentParentId );
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
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnCompoundAddFactory.instance( this );
        this.listModel = CnCompoundListFactory.instance( this );

        // restrict the subword lookup-typeahead values
        this.getTypeaheadData = function( input, viewValue ) {
          var data = this.$$getTypeaheadData( input, viewValue );
          if( angular.isUndefined( data.modifier.where ) ) data.modifier.where = [];

          // restrict by language and don't reference the base word
          if( angular.isDefined( this.addModel.currentParentId ) ) {
            data.modifier.where.push( {
              column: 'word.id',
              operator: '!=',
              value: this.addModel.currentParentId
            } );
            data.modifier.where.push( {
              column: 'language_id',
              operator: '=',
              value: this.addModel.currentParentLanguageId
            } );
          }

          // only get words which are not invalid and not misspelled
          data.modifier.where.push( {
            column: 'misspelled',
            operator: '=',
            value: false
          } );
          data.modifier.where.push( {
            bracket: true,
            open: true
          } );
          data.modifier.where.push( {
            column: 'IFNULL( aft, "" )', // also accept null
            operator: '!=',
            value: 'invalid'
          } );
          data.modifier.where.push( {
            or: true,
            column: 'IFNULL( fas, "" )', // also accept null
            operator: '!=',
            value: 'invalid'
          } );
          data.modifier.where.push( {
            bracket: true,
            open: false
          } );

          // and sort by word
          data.modifier.order = { word: false };

          return data;
        };

        // go directly to the word when clicking on a compound
        this.transitionToViewState = async function( record ) {
          return await $state.go( 'word.view', { identifier: record.word_id } );
        };
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
