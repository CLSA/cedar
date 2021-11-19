cenozoApp.defineModule( { name: 'sound_file', models: ['list', 'view'], create: module => {

  angular.extend( module, {
    identifier: {
      parent: {
        subject: 'participant',
        column: 'participant.uid'
      }
    },
    name: {
      singular: 'sound file',
      plural: 'sound files',
      possessive: 'sound file\'s'
    },
    columnList: {
      uid: {
        column: 'participant.uid',
        title: 'Participant'
      },
      test_type: {
        column: 'test_type.name',
        title: 'Test Type'
      },
      datetime: {
        title: 'Date & Time',
        type: 'datetime'
      },
      identifying: {
        title: 'Identifying',
        type: 'boolean'
      }
    },
    defaultOrder: {
      column: 'sound_file.datetime',
      reverse: false
    }
  } );

  module.addInputGroup( '', {
    uid: {
      column: 'participant.uid',
      title: 'Participant',
      type: 'string',
      isConstant: true
    },
    test_type: {
      column: 'test_type.name',
      title: 'Test Type',
      type: 'string',
      isConstant: true
    },
    datetime: {
      column: 'datetime',
      title: 'Date & Time',
      type: 'datetimesecond'
    },
    identifying: {
      title: 'Identifying',
      type: 'boolean',
      help: 'Whether the sound file has identifying details about the participant.'
    },
    url: {
      title: 'Recording',
      type: 'audio_url'
    }
  } );

} } );
