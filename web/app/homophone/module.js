cenozoApp.defineModule({
  name: "homophone",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "homophone",
        plural: "homophones",
        possessive: "homophone's",
      },
      columnList: {
        first_word: { column: "first_word.word", title: "First Word" },
        first_language: {
          column: "first_language.code",
          title: "First Language",
        },
        rank: { title: "Rank", type: "rank" },
        word: { column: "word.word", title: "Word" },
        language: { column: "language.code", title: "Language" },
        word_id: { type: "hidden" },
      },
      defaultOrder: {
        column: "first_word.word",
        reverse: false,
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnHomophoneModelFactory", [
      "CnBaseModelFactory",
      "CnHomophoneListFactory",
      "CnHomophoneViewFactory",
      "$state",
      function (
        CnBaseModelFactory,
        CnHomophoneListFactory,
        CnHomophoneViewFactory,
        $state
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.listModel = CnHomophoneListFactory.instance(this);
          this.viewModel = CnHomophoneViewFactory.instance(this, root);

          // add word back into the data array (even if word is the parent module)
          this.getDataArray = function (removeList, type) {
            var data = this.$$getDataArray(removeList, type);
            if ("list" == type && null == data.findByProperty("title", "Word"))
              data.push(this.columnList.word);
            if ("word" == this.getSubjectFromState())
              data.splice(data.findIndexByProperty("title", "First Word"), 1);
            return data;
          };

          // go directly to the word when clicking on a homophone
          this.transitionToViewState = async function (record) {
            await $state.go("word.view", { identifier: record.word_id });
          };
        };

        return {
          root: new object(true),
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);
  },
});
