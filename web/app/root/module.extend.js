cenozoApp.extendModule({
  name: "root",
  dependencies: ["transcription"],
  create: (module) => {
    var transcriptionModule = cenozoApp.module("transcription");

    // extend the view factory
    cenozo.providers.decorator("cnHomeDirective", [
      "$delegate",
      "$compile",
      "CnSession",
      "CnTranscriptionModelFactory",
      function (
        $delegate,
        $compile,
        CnSession,
        CnTranscriptionModelFactory
      ) {
        var oldController = $delegate[0].controller;
        var oldLink = $delegate[0].link;

        if ("typist" == CnSession.role.name) {
          // show typists their active transcriptions on their home page
          angular.extend($delegate[0], {
            compile: function () {
              return function (scope, element, attrs) {
                if (angular.isFunction(oldLink)) oldLink(scope, element, attrs);
                const el = angular.element(element[0].querySelector(".inner-view-frame div"));
                el.append('<cn-transcription-list model="transcriptionModel"></cn-transcription-list>');
                $compile(element.contents())(scope);
              };
            },
            controller: function ($scope) {
              oldController($scope);

              $scope.transcriptionModel = CnTranscriptionModelFactory.instance();
              $scope.transcriptionModel.listModel.heading = "Transcription List";
            },
          });
        }

        return $delegate;
      },
    ]);
  },
});
