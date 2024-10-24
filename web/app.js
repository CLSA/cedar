"use strict";

var cenozo = angular.module("cenozo");

cenozo.controller("HeaderCtrl", [
  "$scope",
  "CnBaseHeader",
  function ($scope, CnBaseHeader) {
    // copy all properties from the base header
    CnBaseHeader.construct($scope);
  },
]);

/* ############################################################################################## */
cenozoApp.initDataModule = function (module, name) {
  angular.extend(module, {
    identifier: {},
    name: {
      singular: name + " Data",
      plural: name + " Data",
      possessive: name + " Data's",
      pluralPossessive: name + " Data's",
    },
  });
};

/* ############################################################################################## */
cenozo.factory("CnWordTypeaheadFactory", [
  "$timeout",
  "CnSession",
  "CnHttpFactory",
  function ($timeout, CnSession, CnHttpFactory) {
    var object = function (params) {
      this.getLanguageIdRestrictList = function () {
        return [];
      };
      this.testType = null;
      angular.extend(this, params);

      angular.extend(this, {
        lastGUID: null,
        isLoading: false,
        valueCache: [],
        resolveList: function (value) {
          this.lastGUID = null;
          this.isLoading = false;
          return 3 >= value.length
            ? this.valueCache
            : this.valueCache.filter(
                (word) => null != word.word.match("^" + value)
              );
        },
        getValidLetters: function () {
          var validLetters = "";
          this.getLanguageIdRestrictList().forEach((languageId) => {
            validLetters += CnSession.setting.specialLetter[languageId];
          });
          return validLetters;
        },
        isWordValid: function (word) {
          // valid words start with a letter, may have [-' ] in the middle and ends with a letter,
          // must be 2+ characters long and may be enclosed by double-quotes (")
          word = word.replace(/^"([^"]+)"$/, "$1"); // remove double quotes at front/end
          var validLetters = this.getValidLetters();
          var re = new RegExp(
            "^[a-z" +
              validLetters +
              "]" +
              "([-' a-z" +
              validLetters +
              "]*" +
              "[a-z" +
              validLetters +
              "])?$"
          );
          return null != word.match(re);
        },
        getValues: async function (value) {
          var guid = cenozo.generateGUID();

          // convert to lower case
          value = value.toLowerCase();

          this.lastGUID = guid;
          return await $timeout(async () => {
            // return an empty list if this isn't the last GUID
            if (guid != this.lastGUID) return [];
            if (!this.isWordValid(value)) {
              this.resolveList(value);
              return [];
            }

            this.isLoading = true;

            // see if we have to rebuild the cache
            var value3 = value.substring(0, 3);
            if (
              0 == this.valueCache.length ||
              3 > value.length ||
              null == this.valueCache[0].word.match("^" + value3)
            ) {
              var where = [
                {
                  column: "misspelled",
                  operator: "=",
                  value: false,
                },
                {
                  column: "word",
                  operator: 3 > value.length ? "=" : "LIKE",
                  value: 3 > value.length ? value : value3 + "%",
                },
              ];

              // only restrict by language if there are any in the list
              var list = this.getLanguageIdRestrictList();
              if (0 < list.length)
                where.push({
                  column: "language_id",
                  operator: "IN",
                  value: list,
                });

              // restrict by test type, if required
              if (null != this.testType)
                where.push({
                  column: this.testType,
                  operator: "!=",
                  value: "invalid",
                });

              var response = await CnHttpFactory.instance({
                path: "word",
                data: {
                  select: {
                    column: [
                      "id",
                      "word",
                      { table: "language", column: "code" },
                    ],
                  },
                  modifier: {
                    where: where,
                    order: { word: false },
                    limit: 10000,
                  },
                },
              }).query();

              this.valueCache = angular.copy(response.data);
            }

            return this.resolveList(value);
          }, 200);
        },
      });
    };

    return {
      instance: function (params) {
        return new object(angular.isUndefined(params) ? {} : params);
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.factory("CnBaseRankDataViewDirectiveControllerFactory", [
  "CnHttpFactory",
  "CnModalMessageFactory",
  "CnModalConfirmFactory",
  "CnWordTypeaheadFactory",
  "$timeout",
  function (
    CnHttpFactory,
    CnModalMessageFactory,
    CnModalConfirmFactory,
    CnWordTypeaheadFactory,
    $timeout
  ) {
    return {
      construct: function (scope) {
        scope.isComplete = false;
        scope.isWorking = false;
        scope.wordTypeaheadTemplateUrl = cenozoApp.getFileUrl(
          "cedar",
          "word-typeahead-match.tpl.html"
        );

        function postSubmit(selected) {
          if (!selected) scope.preventSelectedNewWord = false;
          document.getElementById("newWord").focus();
        }

        angular.extend(scope, {
          typeaheadModel: CnWordTypeaheadFactory.instance({
            getLanguageIdRestrictList: function () {
              return scope.model.testEntryModel.viewModel.languageIdList;
            },
            testType: scope.model.testType,
          }),
          cursor: null,
          cursorType: null,
          preventSelectedNewWord: false,
          toggleCursor: function (rank) {
            if (null == scope.cursorType) {
              scope.cursorType = "insert";
              scope.cursor = rank;
            } else if ("insert" == scope.cursorType) {
              if (rank == scope.cursor) {
                scope.cursorType = "replace";
              } else {
                scope.cursorType = "insert";
                scope.cursor = rank;
              }
            } else {
              if (rank == scope.cursor) {
                scope.cursorType = null;
                scope.cursor = null;
              } else {
                scope.cursorType = "insert";
                scope.cursor = rank;
              }
            }

            postSubmit(false);
          },
          submitNewWord: async function (selected) {
            // string if it's a new word, integer if it's an existing intrusion
            if (
              angular.isObject(scope.newWord) ||
              (null == scope.typeaheadModel.lastGUID &&
                0 < scope.newWord.length)
            ) {
              // prevent double-entry from enter key and typeahead selection
              var proceed = true;
              if (!selected) scope.preventSelectedNewWord = true;
              else if (scope.preventSelectedNewWord) proceed = false;

              if (proceed && angular.isString(scope.newWord)) {
                // get rid of en- and em-dashes
                scope.newWord = scope.newWord
                  .toLowerCase()
                  .replace(/[—–]/g, "-");
                if (
                  !scope.typeaheadModel.isWordValid(scope.newWord) &&
                  !scope.newWord.match(/^-+$/)
                ) {
                  await CnModalMessageFactory.instance({
                    title: "Invalid Word",
                    message:
                      "The word you have provided is invalid.\n\n" +
                      "Please enter a word at least two characters long using only letters, " +
                      "single-quotes ('), dashes (-) and spaces, and which starts with at " +
                      "least one alphabetic letter.",
                    error: true,
                  }).show();
                  proceed = false;
                }
              }

              if (proceed) await scope.submitWord(scope.newWord, selected);
            }
          },
          submitWord: async function (word, selected) {
            if (angular.isUndefined(selected)) selected = false;
            if (angular.isString(word) && null != word.match(/^-+$/))
              word = { id: null };
            scope.isWorking = true;
            scope.newWord = "";
            try {
              scope.model.viewModel.submitIntrusion(
                word,
                scope.cursor,
                "replace" == scope.cursorType
              );
            } finally {
              scope.cursor = null; // return the cursor to the end of the list
              scope.cursorType = null;
              scope.isWorking = false;
              await $timeout(function () {
                postSubmit(selected);
              }, 20);
            }
          },
          removeWord: async function (word) {
            var response = await CnModalConfirmFactory.instance({
              title:
                "Remove " +
                ("placeholder" == word.word_type
                  ? "placeholder"
                  : '"' + word.word + '"'),
              message:
                "Are you sure you want to remove " +
                ("placeholder" == word.word_type
                  ? "the placeholder"
                  : '"' + word.word + '"') +
                " from the word list?",
            }).show();

            if (response) {
              try {
                scope.isWorking = false;
                await scope.model.viewModel.deleteIntrusion(word);
              } finally {
                // we may have to change the cursor if it is no longer valid
                if (null != scope.cursor) {
                  var len = scope.model.viewModel.record.length;
                  if (
                    0 == len ||
                    scope.model.viewModel.record[len - 1].rank < scope.cursor
                  ) {
                    scope.cursor = null;
                    scope.cursorType = null;
                  }
                }

                scope.isWorking = false;
                postSubmit(false);
              }
            }
          },
        });

        async function init() {
          try {
            await scope.model.viewModel.onView();
          } finally {
            scope.isComplete = true;
          }
        }

        init();
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.directive("cnAudio", [
  "$sce",
  function ($sce) {
    return {
      restrict: "A",
      scope: { cnAudio: "=" },
      replace: true,
      template: '<audio ng-src="{{url}}" type="audio/wav" controls></audio>',
      link: function (scope) {
        scope.$watch("cnAudio", function (newVal, oldVal) {
          if (newVal !== undefined) scope.url = $sce.trustAsResourceUrl(newVal);
        });
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.directive("cnSubmitWord", [
  function () {
    return {
      restrict: "A",
      require: "ngModel",
      link: function (scope, element, attrs) {
        element.bind("keydown", function (event) {
          scope.$evalAsync(function () {
            if (13 == event.which) scope.$eval(attrs.cnSubmitWord);
          });
        });
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.factory("CnBaseDataViewFactory", [
  "CnBaseViewFactory",
  "CnHttpFactory",
  "CnModalMessageFactory",
  "CnModalNewWordFactory",
  function (
    CnBaseViewFactory,
    CnHttpFactory,
    CnModalMessageFactory,
    CnModalNewWordFactory
  ) {
    return {
      construct: function (object, parentModel, root) {
        CnBaseViewFactory.construct(object, parentModel, root);
        angular.extend(object, {
          getTestEntryPath: function () {
            var path = parentModel.getServiceCollectionPath();
            return path.substring(0, path.lastIndexOf("/"));
          },
          // write a custom onView function
          onView: async function () {
            object.isLoading = true;

            // start by confirming whether or not this is the correct test type for the test entry
            await parentModel.testEntryModel.viewModel.onViewPromise;

            if (
              parentModel.getDataType() ==
              parentModel.testEntryModel.viewModel.record.data_type
            ) {
              await object.$$onView(true);
              delete object.record.getIdentifier; // we don't need the identifier function

              // convert boolean to integer
              if (angular.isObject(object.record))
                for (var property in object.record)
                  if ("boolean" == typeof object.record[property])
                    object.record[property] = object.record[property] ? 1 : 0;
            }
          },
          // data view factories may implement this, but if not then we must return true after a fulfilled promise
          checkBeforeSubmit: async function () {
            return true;
          },
        });

        if (
          "aft" == parentModel.getDataType() ||
          "fas" == parentModel.getDataType()
        ) {
          angular.extend(object, {
            submitIntrusion: async function (word, rank, replace) {
              // private method used below
              async function sendIntrusion(input, rank, replace) {
                var data = angular.isDefined(input.id)
                  ? { word_id: input.id }
                  : input;
                if (null != rank) data.rank = rank;

                try {
                  var response = await CnHttpFactory.instance({
                    path: object.parentModel.getServiceResourcePath(),
                    data: data,
                    onError: function (error) {
                      if (406 == error.status) {
                        // the word is misspelled
                        return CnModalMessageFactory.instance({
                          title: "Misspelled Word",
                          message:
                            "You have selected a misspelled word. This word cannot be used.",
                        }).show();
                      } else if (409 == error.status) {
                        // the word is invalid
                        return CnModalMessageFactory.instance({
                          title: "Invalid Word",
                          message:
                            "You have selected an invalid word. This word cannot be used.",
                        }).show();
                      } else CnModalMessageFactory.httpError(error);
                    },
                  }).post();

                  if (null != rank) {
                    var index = object.record.findIndexByProperty("rank", rank);
                    if (null != index) {
                      // remove the word at the found index if we are in replace mode
                      if (replace) {
                        await CnHttpFactory.instance({
                          path:
                            object.parentModel.getServiceResourcePath() +
                            "/" +
                            object.record[index].id,
                        }).delete();
                        object.record.splice(index, 1, response.data);
                      } else {
                        object.record.forEach((word) => {
                          if (word.rank >= rank) word.rank++;
                        });
                        object.record.splice(index, 0, response.data);
                      }
                    } else {
                      console.warn(
                        'Tried inserting word at rank "' +
                          rank +
                          '", which was not found in the list'
                      );
                    }
                  } else {
                    object.record.push(response.data);
                  }
                } catch (error) {
                  // handled by onError above
                }
              }

              if (angular.isString(word)) {
                // remove case and double quotes if they are found at the start/end
                word = word.replace(/^"|"$/g, "").toLowerCase();

                // it's a new word, so double-check with the user before proceeding
                var response = await CnModalNewWordFactory.instance({
                  word: word,
                  languageId:
                    object.parentModel.testEntryModel.viewModel.record
                      .participant_language_id,
                  languageIdRestrictList:
                    object.parentModel.testEntryModel.viewModel.languageIdList,
                }).show();

                if (null != response)
                  await sendIntrusion(
                    { language_id: response, word: word },
                    rank,
                    replace
                  );
              } else {
                await sendIntrusion(word, rank, replace); // it's not a new word so send it immediately
              }
            },
            deleteIntrusion: async function (wordRecord) {
              await CnHttpFactory.instance({
                path:
                  object.parentModel.getServiceResourcePath() +
                  "/" +
                  wordRecord.id,
              }).delete();

              var index = object.record.findIndexByProperty(
                "id",
                wordRecord.id
              );
              if (null != index) {
                object.record.splice(index, 1);
                object.record.forEach((word) => {
                  if (word.rank > wordRecord.rank) word.rank--;
                });
              } else {
                console.warn(
                  "Tried removing word which was not found in the list"
                );
              }
            },
          });
        }
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.factory("CnBaseDataModelFactory", [
  "CnBaseModelFactory",
  "CnSession",
  "$state",
  function (CnBaseModelFactory, CnSession, $state) {
    return {
      construct: function (object, module) {
        CnBaseModelFactory.construct(object, module);
        angular.extend(object, {
          getDataType: function () {
            var path = object.getServiceCollectionPath();
            var type = path.substring(path.lastIndexOf("/") + 1);
            return type.substring(0, type.indexOf("_"));
          },
          getServiceResourcePath: function (resource) {
            var path = object.getServiceCollectionPath();
            var type = path.substring(path.lastIndexOf("/") + 1);
            return "premat_data" == type || "rey_data" == type
              ? type + "/test_entry_id=" + $state.params.identifier
              : "test_entry/" + $state.params.identifier + "/" + type;
          },
        });

        if ("aft" == object.getDataType() || "fas" == object.getDataType()) {
          angular.extend(object, {
            getServiceData: function (type, columnRestrictLists) {
              var data = object.$$getServiceData(type, columnRestrictLists);
              if ("view" == type) {
                if (angular.isUndefined(data.modifier)) data.modifier = {};
                var order = {};
                order[object.getDataType() + "_data.rank"] = false;
                angular.extend(data.modifier, {
                  order: order,
                  limit: 10000, // do not limit the number of records returned
                });
                data.select = {
                  column: [
                    "rank",
                    { table: "word", column: "word" },
                    { table: "language", column: "code" },
                    "word_type",
                  ],
                };
              }
              return data;
            },
          });
        }
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.service("CnModalNewWordFactory", [
  "$uibModal",
  "CnHttpFactory",
  function ($uibModal, CnHttpFactory) {
    var object = function (params) {
      angular.extend(this, {
        title: "Confirm Word",
        word: null,
        languageId: null,
        languageIdRestrictList: [],
        languageList: [],
      });

      angular.extend(this, params);

      // make sure the initial languageId is in the restrict list
      if (!this.languageIdRestrictList.includes(this.languageId))
        this.languageId = this.languageIdRestrictList[0];

      this.show = async function () {
        var where = [{ column: "active", operator: "=", value: true }];
        if (0 < this.languageIdRestrictList.length)
          where.push({
            column: "id",
            operator: "IN",
            value: this.languageIdRestrictList,
          });
        var response = await CnHttpFactory.instance({
          path: "language",
          data: {
            select: { column: ["id", "name"] },
            modifier: { where: where, order: { name: false } },
          },
        }).query();

        this.languageList = [];
        response.data.forEach((item) => {
          this.languageList.push({ value: item.id, name: item.name });
        });

        var self = this;
        return $uibModal.open({
          backdrop: "static",
          keyboard: true,
          modalFade: true,
          templateUrl: cenozoApp.getFileUrl("cedar", "modal-new-word.tpl.html"),
          controller: function ($scope, $uibModalInstance) {
            $scope.model = self;
            $scope.proceed = function () {
              $uibModalInstance.close($scope.model.languageId);
            };
            $scope.cancel = function () {
              $uibModalInstance.close(null);
            };
          },
        }).result;
      };
    };

    return {
      instance: function (params) {
        return new object(angular.isUndefined(params) ? {} : params);
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.service("CnModalSelectTypistFactory", [
  "$uibModal",
  "CnSession",
  "CnHttpFactory",
  function ($uibModal, CnSession, CnHttpFactory) {
    var object = function (params) {
      this.title = "Select Typist";
      this.message = "Please select a typist:";
      this.site_id = CnSession.site.id;
      this.languageIdRestrictList = [];
      this.userList = [];

      angular.extend(this, params);

      this.show = async function () {
        var response = await CnHttpFactory.instance({
          path: "user",
          data: {
            select: { column: ["id", "name", "first_name", "last_name"] },
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
                  value: this.site_id,
                },
              ],
              order: "name",
            },
          },
        }).query();

        this.userList = [{ name: "(Select Typist)", value: undefined }];
        response.data.forEach((item) => {
          this.userList.push({
            value: item.id,
            name:
              item.first_name + " " + item.last_name + " (" + item.name + ")",
          });
        });

        var self = this;
        return $uibModal.open({
          backdrop: "static",
          keyboard: true,
          modalFade: true,
          templateUrl: cenozoApp.getFileUrl(
            "cedar",
            "modal-select-typist.tpl.html"
          ),
          controller: function ($scope, $uibModalInstance) {
            $scope.model = self;
            $scope.proceed = function () {
              $uibModalInstance.close($scope.user_id);
            };
            $scope.cancel = function () {
              $uibModalInstance.close(null);
            };
          },
        }).result;
      };
    };

    return {
      instance: function (params) {
        return new object(angular.isUndefined(params) ? {} : params);
      },
    };
  },
]);

/* ############################################################################################## */
cenozo.service("CnModalSelectWordFactory", [
  "$uibModal",
  "CnModalMessageFactory",
  "CnWordTypeaheadFactory",
  function ($uibModal, CnModalMessageFactory, CnWordTypeaheadFactory) {
    var object = function (params) {
      angular.extend(this, {
        title: "Select Word",
        message: "Please select a word:",
        word: null,
        languageIdRestrictList: [],
      });

      angular.extend(this, params);

      this.show = function () {
        var self = this;
        return $uibModal.open({
          backdrop: "static",
          keyboard: true,
          modalFade: true,
          templateUrl: cenozoApp.getFileUrl(
            "cedar",
            "modal-select-word.tpl.html"
          ),
          controller: function ($scope, $uibModalInstance) {
            $scope.model = self;
            $scope.wordTypeaheadTemplateUrl = cenozoApp.getFileUrl(
              "cedar",
              "word-typeahead-match.tpl.html"
            );
            angular.extend($scope, {
              typeaheadModel: CnWordTypeaheadFactory.instance({
                getLanguageIdRestrictList: function () {
                  return $scope.model.languageIdRestrictList;
                },
              }),
              proceed: function () {
                var proceed = true;
                if ($scope.word) {
                  if (angular.isString($scope.word)) {
                    var text = $scope.word.toLowerCase().replace(/[—–]/g, "-"); // get rid of en- and em-dashes
                    if (!$scope.typeaheadModel.isWordValid(text)) {
                      CnModalMessageFactory.instance({
                        title: "Invalid Word",
                        message:
                          "The word you have provided is invalid.\n\n" +
                          "Please enter a word at least two characters long using only letters, " +
                          "single-quotes ('), dashes (-) and spaces, and which starts with at " +
                          "least one alphabetic letter.",
                        error: true,
                      }).show();
                      proceed = false;
                    }
                  }
                }

                if (proceed) $uibModalInstance.close($scope.word);
              },
              cancel: function () {
                $uibModalInstance.close(null);
              },
              formatLabel: function (word) {
                return angular.isObject(word)
                  ? word.word + " [" + word.code + "]"
                  : "";
              },
            });
          },
        }).result;
      };
    };

    return {
      instance: function (params) {
        return new object(angular.isUndefined(params) ? {} : params);
      },
    };
  },
]);
