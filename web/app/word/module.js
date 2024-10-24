cenozoApp.defineModule({
  name: "word",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "word",
        plural: "words",
        possessive: "word's",
      },
      columnList: {
        language: {
          column: "language.name",
          title: "Language",
        },
        word: {
          column: "word.word",
          title: "Word",
        },
        animal_code: {
          column: "word.animal_code",
          title: "Animal Code",
        },
        sister_word: {
          column: "sister_word.word",
          title: "Parent Sister",
        },
        compound_count: {
          title: "Compounds",
          type: "number",
        },
        misspelled: {
          column: "word.misspelled",
          title: "Misspelled",
          type: "boolean",
        },
        aft: {
          column: "word.aft",
          title: "AFT Type",
        },
        fas: {
          column: "word.fas",
          title: "FAS Type",
        },
        aft_total: {
          column: "word_test_type_total.aft_total",
          title: "#AFT",
          type: "number",
        },
        fas_total: {
          column: "word_test_type_total.fas_total",
          title: "#FAS",
          type: "number",
        },
        rey_total: {
          column: "word_test_type_total.rey_total",
          title: "#REY",
          type: "number",
        },
        update_timestamp: {
          column: "word.update_timestamp",
          title: "Timestamp",
          type: "datetime",
        },
      },
      defaultOrder: {
        column: "word.word",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      language_id: {
        title: "Language",
        type: "enum",
        isConstant: "view",
      },
      word: {
        title: "Word",
        type: "string",
        format: "identifier",
        isConstant: "view",
      },
      animal_code: {
        title: "Animal Code",
        type: "string",
        // regex is exactly 7 integers >= 0 delimited by a period (.)
        regex:
          "^([0-9]|[1-9][0-9]+)." +
          "([0-9]|[1-9][0-9]+)." +
          "([0-9]|[1-9][0-9]+)." +
          "([0-9]|[1-9][0-9]+)." +
          "([0-9]|[1-9][0-9]+)." +
          "([0-9]|[1-9][0-9]+)." +
          "([0-9]|[1-9][0-9]+)$",
      },
      sister_word_id: {
        title: "Parent Sister Word",
        type: "lookup-typeahead",
        typeahead: {
          table: "word",
          select: 'CONCAT( word.word, " [", language.code, "]" )',
          where: "word.word",
          modifier: {
            where: [
              { column: "word.fas", operator: "!=", value: "invalid" },
              { column: "word.sister_word_id", operator: "=", value: null },
            ],
          },
        },
        isConstant: function ($state, model) {
          return 0 == model.viewModel.compoundWordCount ? false : "view";
        },
      },
      misspelled: {
        title: "Misspelled",
        type: "boolean",
      },
      aft: {
        title: "AFT Type",
        type: "enum",
      },
      fas: {
        title: "FAS Type",
        type: "enum",
      },
      description: {
        title: "Description",
        type: "text",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnWordViewFactory", [
      "CnBaseViewFactory",
      "CnModalMessageFactory",
      "CnModalSelectWordFactory",
      "CnModalTextFactory",
      "CnSession",
      "CnHttpFactory",
      function (
        CnBaseViewFactory,
        CnModalMessageFactory,
        CnModalSelectWordFactory,
        CnModalTextFactory,
        CnSession,
        CnHttpFactory
      ) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "compound");

          angular.extend(this, {
            lastMisspelledValue: null,
            lastAftValue: null,
            lastFasValue: null,
            sisterWordLastPatched: false,
            compoundWordCount: 0,
            wordLocked: false,

            updateWordLocked: function () {
              this.wordLocked =
                "administrator" != CnSession.role.name &&
                "" !== this.record.mispelled &&
                "" !== this.record.aft &&
                "" !== this.record.fas;
            },

            onView: async function (force) {
              // keep track of how many compound words this word has (to set sister_word_id to constant above)
              var response = await CnHttpFactory.instance({
                path: this.parentModel.getServiceResourcePath() + "/compound",
              }).count();
              this.compoundWordCount = parseInt(response.headers("Total"));

              // do not allow words to be edited by non-admins once misspelled, aft and fas has been defined
              await this.$$onView(force);

              this.updateWordLocked();
              var self = this;
              this.parentModel.getEditEnabled = function () {
                return self.parentModel.$$getEditEnabled() && !self.wordLocked;
              };
            },

            onPatch: async function (data) {
              this.sisterWordLastPatched = angular.isDefined(
                data.sister_word_id
              );

              if (
                true == data.misspelled ||
                "invalid" == data.aft ||
                "invalid" == data.fas
              ) {
                var which =
                  "invalid" == data.aft
                    ? "invalid" == this.record.fas
                      ? "All AFT and REY"
                      : "All AFT"
                    : "invalid" == data.fas
                    ? "invalid" == this.record.aft
                      ? "All FAS and REY"
                      : "All FAS"
                    : "All";

                var undo = false;
                if (true == data.misspelled) {
                  var response = await CnModalSelectWordFactory.instance({
                    message:
                      "Please select the correct spelling for this word.\n\n" +
                      "If you provide a word then all test-entries using the misspelled word will be " +
                      "changed to the selected word. You may leave the replacement word blank if you do " +
                      "want test-entries to be affected.",
                    languageIdRestrictList: [this.record.language_id],
                  }).show();

                  if (null == response) undo = true;
                  else data.correct_word = response;
                }

                if (!undo) {
                  // get a message to leave in test-entries using this word
                  var response = await CnModalTextFactory.instance({
                    title: "Test Entry Note",
                    message:
                      which +
                      " test entries using this word will be re-assigned to the last user that " +
                      "it was assigned to.  Please provide a note that will be added to these test-entries:",
                    text:
                      "The " +
                      this.record.language +
                      ' word "' +
                      this.record.word +
                      '" which is used by ' +
                      "this test-entry has been marked as invalid. Please replace this word with another " +
                      "valid word and re-submit.",
                    minLength: 10,
                  }).show();

                  if (!response) {
                    undo = true;
                  } else {
                    data.note = response;
                    await this.$$onPatch(data);

                    // setting misspelled to true means aft and fas must be invalid
                    if (true == data.misspelled) {
                      this.record.aft = "invalid";
                      this.record.fas = "invalid";
                    }

                    // if a note was added then the test-entry list may have changed
                    if (angular.isDefined(this.testEntryModel))
                      this.testEntryModel.listModel.onList(true);

                    this.updateWordLocked();
                  }
                }

                if (undo) {
                  if (true == data.misspelled) {
                    this.record.misspelled =
                      null == this.lastMisspelledValue
                        ? this.backupRecord.misspelled
                        : this.lastMisspelledValue;
                  } else if ("invalid" == data.aft) {
                    this.record.aft =
                      null == this.lastAftValue
                        ? this.backupRecord.aft
                        : this.lastAftValue;
                  } else if ("invalid" == data.fas) {
                    this.record.fas =
                      null == this.lastFasValue
                        ? this.backupRecord.fas
                        : this.lastFasValue;
                  }
                }
              } else {
                // not setting misspelled to true
                await this.$$onPatch(data);

                if (angular.isDefined(data.misspelled)) {
                  this.lastMisspelledValue = data.misspelled;
                  this.lastAftValue = data.aft;
                  this.lastFasValue = data.fas;
                } else if (
                  "intrusion" == data.aft ||
                  "primary" == data.aft ||
                  "intrusion" == data.fas ||
                  "primary" == data.fas
                ) {
                  // setting aft or fas to intrusion or primary means the word cannot be misspelled
                  this.record.misspelled = false;
                } else if (angular.isDefined(data.animal_code)) {
                  if (0 == data.animal_code.length) {
                    if ("primary" == this.record.aft) this.record.aft = "";
                  } else {
                    this.record.aft = "primary";
                    this.record.misspelled = false;
                  }
                }

                this.updateWordLocked();
              }
            },

            // reset the formatted sister word if there is a problem
            onPatchError: function (response) {
              this.$$onPatchError(response);
              if (
                306 == response.status &&
                angular.isDefined(response.config.data.sister_word_id)
              ) {
                this.formattedRecord.sister_word_id =
                  this.backupRecord.formatted_sister_word_id;
              }
            },
          });

          // warn if the new sister word is an intrusion
          this.afterPatch(async () => {
            if (this.sisterWordLastPatched) {
              if (this.record.sister_word_id) {
                var response = await CnHttpFactory.instance({
                  path: "word/" + this.record.sister_word_id,
                  data: { select: { column: "fas" } },
                }).get();

                if ("intrusion" == response.data.fas) {
                  await CnModalMessageFactory.instance({
                    title: "Parent Sister Word is Intrusion",
                    message:
                      "Warning, the parent sister word you have selected is an FAS intrusion. " +
                      "Please check to make sure you have selected the correct parent sister word.",
                  }).show();
                }
              }
              this.sisterWordLastPatched = false;
            }
          });

          async function init(object) {
            await object.deferred.promise;

            // disable the choosing of test-entries using this word
            if (angular.isDefined(object.testEntryModel))
              object.testEntryModel.getChooseEnabled = function () {
                return false;
              };

            // only allow words with no animal code to be compounded
            if (angular.isDefined(object.compoundModel)) {
              object.compoundModel.getAddEnabled = function () {
                return (
                  object.compoundModel.$$getAddEnabled() &&
                  angular.isDefined(object.record.animal_code) &&
                  !object.record.animal_code
                );
              };
            }
          }

          init(this);
        };
        return {
          instance: function (parentModel, root) {
            return new object(parentModel, root);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnWordModelFactory", [
      "CnBaseModelFactory",
      "CnWordAddFactory",
      "CnWordListFactory",
      "CnWordViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnWordAddFactory,
        CnWordListFactory,
        CnWordViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnWordAddFactory.instance(this);
          this.listModel = CnWordListFactory.instance(this);
          this.viewModel = CnWordViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "language",
              data: {
                select: { column: ["id", "name"] },
                modifier: {
                  where: { column: "active", operator: "=", value: true },
                  order: { name: false },
                  limit: 1000,
                },
              },
            }).query();

            this.metadata.columnList.language_id.enumList =
              response.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);
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
