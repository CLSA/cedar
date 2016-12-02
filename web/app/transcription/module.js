define( function() {
  'use strict';

  try { var module = cenozoApp.module( 'transcription', true ); } catch( err ) { console.warn( err ); return; }
  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'transcription',
      plural: 'transcriptions',
      possessive: 'transcription\'s',
      pluralPossessive: 'transcriptions\''
    },
    columnList: {
      user: {
        column: 'user.name',
        title: 'User'
      },
      participant: {
        column: 'participant.uid',
        title: 'UID'
      },
      site: {
        column: 'site.name',
        title: 'Site'
      },
      start_datetime: {
        column: 'start_datetime',
        title: 'Start',
        type: 'datetimesecond'
      },
      start_datetime: {
        column: 'end_datetime',
        title: 'End',
        type: 'datetimesecond'
      }
    },
    defaultOrder: {
      column: 'transcription.start_datetime',
      reverse: true
    }
  } );

  module.addInputGroup( '', {
    user_id: {
      title: 'User',
      type: 'lookup-typeahead',
      typeahead: {
        table: 'user',
        select: 'CONCAT( first_name, " ", last_name, " (", name, ")" )',
        where: [ 'first_name', 'last_name', 'name' ]
      }
    },
    participant: {
      column: 'participant.uid',
      title: 'Participant',
      type: 'string',
      constant: true
    },
    site_id: {
      column: 'site.name',
      title: 'Site',
      type: 'string',
      constant: true
    },
    start_datetime: {
      column: 'start_datetime',
      title: 'Start Date & Time',
      type: 'datetimesecond',
      max: 'end_datetime'
    },
    end_datetime: {
      column: 'end_datetime',
      title: 'End Date & Time',
      type: 'datetimesecond',
      min: 'start_datetime',
      max: 'now'
    }
  } );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTranscriptionAdd', [
    'CnTranscriptionModelFactory',
    function( CnTranscriptionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'add.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTranscriptionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTranscriptionList', [
    'CnTranscriptionModelFactory',
    function( CnTranscriptionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'list.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTranscriptionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.directive( 'cnTranscriptionView', [
    'CnTranscriptionModelFactory',
    function( CnTranscriptionModelFactory ) {
      return {
        templateUrl: module.getFileUrl( 'view.tpl.html' ),
        restrict: 'E',
        scope: { model: '=?' },
        controller: function( $scope ) {
          if( angular.isUndefined( $scope.model ) ) $scope.model = CnTranscriptionModelFactory.root;
        }
      };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionAddFactory', [
    'CnBaseAddFactory',
    function( CnBaseAddFactory ) {
      var object = function( parentModel ) { CnBaseAddFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionListFactory', [
    'CnBaseListFactory',
    function( CnBaseListFactory ) {
      var object = function( parentModel ) { CnBaseListFactory.construct( this, parentModel ); };
      return { instance: function( parentModel ) { return new object( parentModel ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionViewFactory', [
    'CnBaseViewFactory',
    function( CnBaseViewFactory ) {
      var object = function( parentModel, root ) { CnBaseViewFactory.construct( this, parentModel, root ); }
      return { instance: function( parentModel, root ) { return new object( parentModel, root ); } };
    }
  ] );

  /* ######################################################################################################## */
  cenozo.providers.factory( 'CnTranscriptionModelFactory', [
    'CnBaseModelFactory',
    'CnTranscriptionAddFactory', 'CnTranscriptionListFactory', 'CnTranscriptionViewFactory', 'CnHttpFactory',
    function( CnBaseModelFactory,
              CnTranscriptionAddFactory, CnTranscriptionListFactory, CnTranscriptionViewFactory, CnHttpFactory ) {
      var object = function( root ) {
        var self = this;
        CnBaseModelFactory.construct( this, module );
        this.addModel = CnTranscriptionAddFactory.instance( this );
        this.listModel = CnTranscriptionListFactory.instance( this );
        this.viewModel = CnTranscriptionViewFactory.instance( this, root );
      };

      return {
        root: new object( true ),
        instance: function() { return new object( false ); }
      };
    }
  ] );

} );
