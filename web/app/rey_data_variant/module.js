cenozoApp.defineModule( { name: 'rey_data_variant', models: 'list', create: module => {

  angular.extend( module, {
    identifier: {},
    name: {
      singular: 'REY data variant',
      plural: 'REY data variants',
      possessive: 'REY data variant\'s'
    },
    columnList: {
      word: { title: 'Word' },
      language: { column: 'language.name', title: 'Language' },
      variant: { column: 'variant.word', title: 'Variant' },
      variant_language: { column: 'variant_language.name', title: 'Variant Language' }
    },
    defaultOrder: {
      column: 'language.name',
      reverse: false
    }
  } );

} } );
