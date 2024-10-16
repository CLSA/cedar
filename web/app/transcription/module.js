cenozoApp.defineModule({
  name: "transcription",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: { column: "uid" },
      name: {
        singular: "transcription",
        plural: "transcriptions",
        possessive: "transcription's",
      },
      columnList: {
        uid: {
          column: "participant.uid",
          title: "Participant",
        },
        cohort: {
          column: "cohort.name",
          title: "Cohort",
        },
        user: {
          column: "user.name",
          title: "Assigned",
          isIncluded: function ($state, model) {
            return !model.isRole("typist");
          },
          help: "Which user the transcription is assigned to",
        },
        user_list: {
          title: "User List",
          isIncluded: function ($state, model) {
            return !model.isRole("typist");
          },
          help: "Which users have worked with at least one test-entry, ordered by first access date",
        },
        language_list: {
          title: "Language List",
          help: "Which languages the transcription has been associated with (based on all test-entries)",
        },
        site: {
          column: "site.name",
          title: "Credited Site",
          isIncluded: function ($state, model) {
            return !model.isRole("typist");
          },
        },
        state: {
          title: "State",
          type: "string",
          isIncluded: function ($state, model) {
            return !model.isRole("typist");
          },
          help: 'One of "assigned", "deferred" or "completed"',
        },
        start_datetime: {
          column: "start_datetime",
          title: "Start",
          type: "datetimesecond",
        },
        end_datetime: {
          column: "end_datetime",
          title: "End",
          type: "datetimesecond",
          help: "Only set once all test entries have been submitted",
        },
      },
      defaultOrder: {
        column: "transcription.start_datetime",
        reverse: true,
      },
    });

    module.addInputGroup("", {
      uid: {
        column: "participant.uid",
        title: "Participant",
        type: "string",
        isExcluded: "add",
        isConstant: true,
      },
      user_id: {
        title: "User",
        type: "hidden",
        help: "Which user the transcription is assigned to",
      },
      site_id: {
        title: "Credited Site",
        type: "hidden",
        isExcluded: "add",
        isConstant: function ($state, model) {
          return !model.isRole("administrator");
        },
      },
      state: {
        title: "State",
        type: "hidden",
        isExcluded: "add",
        isConstant: true,
        help: 'One of "assigned", "deferred" or "completed"',
      },
      start_datetime: {
        column: "start_datetime",
        title: "Start Date & Time",
        type: "datetimesecond",
        isExcluded: "add",
        isConstant: true,
      },
      end_datetime: {
        column: "end_datetime",
        title: "End Date & Time",
        type: "datetimesecond",
        isExcluded: "add",
        isConstant: true,
        help: 'Only set when the state is "completed"',
      },
    });

    if (angular.isDefined(module.actions.multiedit)) {
      module.addExtraOperation("list", {
        title: "Multiedit",
        operation: async function ($state, model) {
          await $state.go("transcription.multiedit");
        },
      });
    }

    module.addExtraOperation("list", {
      title: "Rescore All",
      isIncluded: function ($state, model) {
        return (
          "transcription.list" == $state.current.name &&
          model.canRescoreTestEntries()
        );
      },
      isDisabled: function ($state, model) {
        return model.listModel.rescoreInProgress;
      },
      operation: async function ($state, model) {
        if (await model.listModel.rescoreTestEntries())
          await model.listModel.onList(true);
      },
    });

    module.addExtraOperation("view", {
      title: "Rescore",
      isIncluded: function ($state, model) {
        return model.canRescoreTestEntries();
      },
      isDisabled: function ($state, model) {
        return model.viewModel.rescoreInProgress;
      },
      operation: async function ($state, model) {
        if (await model.viewModel.rescoreTestEntries())
          await model.viewModel.testEntryModel.listModel.onList(true);
      },
    });

    /* ############################################################################################## */
    cenozo.providers.directive("cnTranscriptionMultiedit", [
      "CnTranscriptionMultieditFactory",
      "CnSession",
      "$state",
      "$timeout",
      function (CnTranscriptionMultieditFactory, CnSession, $state, $timeout) {
        return {
          templateUrl: module.getFileUrl("multiedit.tpl.html"),
          restrict: "E",
          controller: function ($scope) {
            $scope.model = CnTranscriptionMultieditFactory.instance();
            $scope.tab = "transcription";
            CnSession.setBreadcrumbTrail([
              {
                title: "Participants",
                go: async function () {
                  await $state.go("transcription.list");
                },
              },
              {
                title: "Multi-Edit",
              },
            ]);

            // trigger the elastic directive when confirming the transcription selection
            $scope.confirm = async function () {
              await $scope.model.confirm();
              angular.element("#uidListString").trigger("elastic");
            };
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnTranscriptionAddFactory", [
      "CnBaseAddFactory",
      "CnModalMessageFactory",
      function (CnBaseAddFactory, CnModalMessageFactory) {
        var object = function (parentModel) {
          CnBaseAddFactory.construct(this, parentModel);

          // extend onNew
          this.onNew = async function (record) {
            await this.$$onNew(record);
            await this.parentModel.updateUserList(
              this.parentModel.getParentIdentifier().identifier
            );
          };

          // extend onAddError (must handle 409 errors in a special way)
          this.onAddError = async function (error) {
            if (409 == error.status) {
              await CnModalMessageFactory.instance({
                title: "Cannot Add Transcription",
                message:
                  "A new transcription cannot be made because the participant already has a " +
                  "transcription.  Only one transcription can exist per participant.",
                error: true,
              });
              this.parentModel.transitionToLastState();
            } else {
              this.$$onAddError(error);
            }
          };
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnTranscriptionListFactory", [
      "CnBaseListFactory",
      "CnModalConfirmFactory",
      "CnHttpFactory",
      function (CnBaseListFactory, CnModalConfirmFactory, CnHttpFactory) {
        var object = function (parentModel) {
          CnBaseListFactory.construct(this, parentModel);

          angular.extend(this, {
            rescoreInProgress: false,
            rescoreTestEntries: async function () {
              var response = await CnModalConfirmFactory.instance({
                title: "Re-Score All Test Entries",
                message:
                  "Are you sure you wish to re-score all test entries?\n\n" +
                  "This process is processor-intensive and may slow down the application for all " +
                  "users while scores are being re-calculated.  You should only continue if it is " +
                  "necessary for tests to be re-scored immediately.",
              }).show();

              if (response) {
                try {
                  this.rescoreInProgress = true;
                  response = await CnHttpFactory.instance({
                    path: "transcription?rescore=1",
                  }).count();
                } finally {
                  this.rescoreInProgress = false;
                }
              }

              return response;
            },
          });
        };
        return {
          instance: function (parentModel) {
            return new object(parentModel);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnTranscriptionMultieditFactory", [
      "CnTranscriptionModelFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (CnTranscriptionModelFactory, CnSession, CnHttpFactory, CnModalMessageFactory) {
        var object = function () {
          this.parentModel = CnTranscriptionModelFactory.root;
          this.module = module;
          this.confirmInProgress = false;
          this.confirmedCount = null;
          this.importRestriction = "no-import";
          this.uidListString = "";
          this.siteList = [];
          this.userList = [];
          this.site_id = undefined;
          this.user_id = undefined;

          this.selectionChanged = function () {
            this.confirmedCount = null;
            this.site_id = undefined;
            this.user_id = undefined;
            this.siteList = [];
            this.userList = [];
          };

          this.selectSite = function () {
            if (angular.isDefined(this.site_id)) {
              this.user_id = undefined;
              var siteObject = this.siteList.findByProperty(
                "value",
                this.site_id
              );
              if (siteObject) this.userList = siteObject.userList;
            }
          };

          this.confirm = async function () {
            this.confirmInProgress = true;
            this.confirmedCount = null;
            var uidRegex = new RegExp(CnSession.application.uidRegex);

            // clean up the uid list
            var fixedList = this.uidListString
              .toUpperCase() // convert to uppercase
              .replace(/[\s,;|\/]/g, " ") // replace whitespace and separation chars with a space
              .replace(/[^a-zA-Z0-9 ]/g, "") // remove anything that isn't a letter, number of space
              .split(" ") // delimite string by spaces and create array from result
              .filter((uid) => null != uid.match(uidRegex)) // match UIDs (eg: A123456)
              .filter((uid, index, array) => index <= array.indexOf(uid)) // make array unique
              .sort(); // sort the array

            // now confirm UID list with server
            if (0 == fixedList.length) {
              this.uidListString = "";
              this.confirmInProgress = false;
            } else {
              var response = await CnHttpFactory.instance({
                path: "transcription",
                data: {
                  uid_list: fixedList,
                  import_restriction: this.importRestriction,
                },
              }).post();

              this.confirmedCount = response.data.length;
              this.uidListString = response.data.join(" ");
              this.confirmInProgress = false;

              // get the user list (typists only)
              this.siteList = [
                {
                  name:
                    "no-import" == this.importRestriction
                      ? "(Select Site)"
                      : "(empty)",
                  value: undefined,
                  siteList: [],
                },
              ];
              this.userList = [
                {
                  name:
                    "no-import" == this.importRestriction
                      ? "(Select Typist)"
                      : "(empty)",
                  value: undefined,
                },
              ];

              var response = await CnHttpFactory.instance({
                path: "site",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: { order: "site.name" },
                },
              }).query();

              await Promise.all(
                response.data.map(async (item) => {
                  var currentSiteId = item.id;
                  this.siteList.push({
                    name: item.name,
                    value: item.id,
                    userList: [
                      {
                        name:
                          "no-import" == this.importRestriction
                            ? "(Select Typist)"
                            : "(empty)",
                        value: undefined,
                      },
                    ],
                  });

                  var response = await CnHttpFactory.instance({
                    path: "user",
                    data: {
                      select: {
                        distinct: true,
                        column: ["id", "name", "first_name", "last_name"],
                      },
                      modifier: {
                        join: [
                          {
                            table: "access",
                            onleft: "user.id",
                            onright: "access.user_id",
                          },
                          {
                            table: "role",
                            onleft: "access.role_id",
                            onright: "role.id",
                          },
                        ],
                        where: [
                          {
                            column: "role.name",
                            operator: "=",
                            value: "typist",
                          },
                          {
                            column: "access.site_id",
                            operator: "=",
                            value: currentSiteId,
                          },
                        ],
                        order: "user.name",
                      },
                    },
                  }).query();

                  var userList = this.siteList.findByProperty(
                    "value",
                    currentSiteId
                  ).userList;
                  response.data.forEach((item) => {
                    userList.push({
                      value: item.id,
                      name:
                        item.first_name +
                        " " +
                        item.last_name +
                        " (" +
                        item.name +
                        ")",
                      user: item.name,
                    });
                  });
                })
              );
            }
          };

          this.processList = async function (type) {
            // test the formats of all columns
            var uidList = this.uidListString.split(" ");

            await CnHttpFactory.instance({
              path: "transcription",
              data: {
                uid_list: uidList,
                user_id: this.user_id,
                site_id: this.site_id,
                import_restriction: this.importRestriction,
                process: true,
              },
              onError: CnModalMessageFactory.httpError,
            }).post();

            var userString = "";
            if (angular.isDefined(this.user_id)) {
              userString +=
                ' and assigned to user "' +
                this.userList.findByProperty("value", this.user_id).user +
                '"';

              if (angular.isDefined(this.site_id)) {
                userString +=
                  ' at site "' +
                  this.siteList.findByProperty("value", this.site_id).name +
                  '"';
              }
            }
            userString += ".";

            await CnModalMessageFactory.instance({
              title: "Transcription(s) Processed",
              message:
                "A total of " +
                uidList.length +
                " transcription" +
                (1 != uidList.length ? "s have " : " has ") +
                "been processed" +
                userString,
            }).show();

            this.confirmedCount = null;
            this.importRestriction = "no-import";
            this.uidListString = "";
            this.userList = [];
            this.user_id = undefined;
          };
        };

        return {
          instance: function () {
            return new object(false);
          },
        };
      },
    ]);

    /* ############################################################################################## */
    cenozo.providers.factory("CnTranscriptionViewFactory", [
      "CnBaseViewFactory",
      "CnHttpFactory",
      function (CnBaseViewFactory, CnHttpFactory) {
        var object = function (parentModel, root) {
          CnBaseViewFactory.construct(this, parentModel, root, "test_entry");

          angular.extend(this, {
            onView: async function (force) {
              await this.$$onView(force);
              await this.parentModel.updateUserList("uid=" + this.record.uid);
            },

            rescoreInProgress: false,

            rescoreTestEntries: async function () {
              var response = false;
              try {
                this.rescoreInProgress = true;
                response = await CnHttpFactory.instance({
                  path: "transcription/" + this.record.id + "?rescore=1",
                }).get();
              } finally {
                this.rescoreInProgress = false;
              }

              return response;
            },
          });

          async function init(object) {
            // never allow the language list to be changed directly, this is done automatically by the database
            await object.deferred;

            if (angular.isDefined(object.languageModel)) {
              object.languageModel.getChooseEnabled = function () {
                return false;
              };
              object.languageModel.listModel.heading =
                "Language List (based on all test-entries)";
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
    cenozo.providers.factory("CnTranscriptionModelFactory", [
      "CnBaseModelFactory",
      "CnTranscriptionAddFactory",
      "CnTranscriptionListFactory",
      "CnTranscriptionViewFactory",
      "CnSession",
      "CnHttpFactory",
      "CnModalMessageFactory",
      function (
        CnBaseModelFactory,
        CnTranscriptionAddFactory,
        CnTranscriptionListFactory,
        CnTranscriptionViewFactory,
        CnSession,
        CnHttpFactory,
        CnModalMessageFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnTranscriptionAddFactory.instance(this);
          this.listModel = CnTranscriptionListFactory.instance(this);
          this.viewModel = CnTranscriptionViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            var response = await CnHttpFactory.instance({
              path: "site",
              data: {
                select: { column: ["id", "name"] },
                modifier: { order: "name", limit: 1000 },
              },
            }).query();

            this.metadata.columnList.site_id = response.data.reduce(
              (list, item) => {
                list.enumList.push({ value: item.id, name: item.name });
                return list;
              },
              { enumList: [] }
            );
          };

          this.canRescoreTestEntries = function () {
            return 2 < CnSession.role.tier;
          };

          if (!this.isRole("typist")) {
            var inputList = module.inputGroupList.findByProperty(
              "title",
              ""
            ).inputList;
            inputList.user_id.type = "enum";
            inputList.site_id.type = "enum";
            inputList.state.type = "string";
          }

          // only show the add transcription button for typists
          // (the participant module will add it manually for other roles when necessary)
          this.getAddEnabled = function () {
            if ("typist" == CnSession.role.name) {
              return (
                this.$$getAddEnabled() &&
                "transcription" == this.getSubjectFromState() &&
                CnSession.setting.maxWorkingTranscriptions >
                  this.listModel.cache.length
              );
            } else {
              return (
                this.$$getAddEnabled() &&
                "participant" == this.getSubjectFromState() &&
                "add_transcription" == this.getActionFromState()
              );
            }
          };

          // adding transcriptions is different for typists and everyone else
          this.getEditEnabled = function () {
            return (
              this.$$getEditEnabled() &&
              "completed" != this.viewModel.record.state
            );
          };

          // override transitionToAddState
          this.transitionToAddState = async function () {
            // typists immediately get a new transcription (no add state required)
            if ("typist" == CnSession.role.name) {
              try {
                var response = await CnHttpFactory.instance({
                  path: "transcription",
                  data: { user_id: CnSession.user.id },
                  onError: async function (error) {
                    if (408 == error.status) {
                      // 408 means there are currently no participants available
                      CnModalMessageFactory.instance({
                        title: "No Participants Available",
                        message: error.data,
                        error: true,
                      }).show();
                    } else if (409 == error.status) {
                      // 409 means there is a conflict (user cannot start new transcriptions)
                      await CnModalMessageFactory.instance({
                        title: "Cannot Begin New Transcription",
                        message: error.data,
                        error: true,
                      }).show();
                    } else CnModalMessageFactory.httpError(error);
                  },
                }).post();

                // immediately view the new transcription
                await this.transitionToViewState({
                  getIdentifier: function () {
                    return response.data;
                  },
                });
              } catch (error) {
                // handled by onError above
              }
            } else {
              await this.$$transitionToAddState(); // everyone else gets the default behaviour
            }
          };

          // special function to update the user list
          this.updateUserList = async function (participantIdentifier) {
            var response = await CnHttpFactory.instance({
              path: "participant/" + participantIdentifier,
              data: {
                select: {
                  column: [{ table: "site", column: "id", alias: "site_id" }],
                },
              },
            }).get();

            // show a warning if the user doesn't have a site
            if (null == response.data.site_id) {
              await CnModalMessageFactory.instance({
                title: "Participant Has No Site",
                message:
                  "This transcription's participant is not associated with a site. Transcriptions " +
                  "cannot be added or viewed until the participant is assigned to a site.",
                error: true,
              }).show();

              this.transitionToLastState();
            }

            var modifier = {
              join: [
                {
                  table: "access",
                  onleft: "user.id",
                  onright: "access.user_id",
                },
                {
                  table: "role",
                  onleft: "access.role_id",
                  onright: "role.id",
                },
              ],
              where: [
                {
                  column: "role.name",
                  operator: "=",
                  value: "typist",
                },
              ],
              order: "name",
            };

            // restrict non all-site roles to the participant's site
            if (!CnSession.role.allSites) {
              modifier.where.push({
                column: "access.site_id",
                operator: "=",
                value: response.data.site_id,
              });
            }

            var response = await CnHttpFactory.instance({
              path: "user",
              data: {
                select: { column: ["id", "name", "first_name", "last_name"] },
                modifier: modifier,
              },
            }).query();

            this.metadata.columnList.user_id.enumList = response.data.reduce(
              (list, item) => {
                list.push({
                  value: item.id,
                  name:
                    item.first_name +
                    " " +
                    item.last_name +
                    " (" +
                    item.name +
                    ")",
                });
                return list;
              },
              []
            );
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
