cenozoApp.defineModule({
  name: "transcription_event_type",
  models: ["add", "list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {},
      name: {
        singular: "transcription event type",
        plural: "transcription event types",
        possessive: "transcription event type's",
      },
      columnList: {
        cohort: { column: "cohort.name", title: "Cohort" },
        event_type: { column: "event_type.name", title: "Event Type" },
      },
      defaultOrder: {
        column: "cohort.name",
        reverse: false,
      },
    });

    module.addInputGroup("", {
      cohort_id: {
        title: "Cohort",
        type: "enum",
      },
      event_type_id: {
        title: "Event Type",
        type: "enum",
      },
    });

    /* ############################################################################################## */
    cenozo.providers.factory("CnTranscriptionEventTypeModelFactory", [
      "CnBaseModelFactory",
      "CnTranscriptionEventTypeAddFactory",
      "CnTranscriptionEventTypeListFactory",
      "CnTranscriptionEventTypeViewFactory",
      "CnHttpFactory",
      function (
        CnBaseModelFactory,
        CnTranscriptionEventTypeAddFactory,
        CnTranscriptionEventTypeListFactory,
        CnTranscriptionEventTypeViewFactory,
        CnHttpFactory
      ) {
        var object = function (root) {
          CnBaseModelFactory.construct(this, module);
          this.addModel = CnTranscriptionEventTypeAddFactory.instance(this);
          this.listModel = CnTranscriptionEventTypeListFactory.instance(this);
          this.viewModel = CnTranscriptionEventTypeViewFactory.instance(this, root);

          // extend getMetadata
          this.getMetadata = async function () {
            await this.$$getMetadata();

            const [cohortResponse, eventTypeResponse] = await Promise.all([
              
              CnHttpFactory.instance({
                path: "cohort",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: {
                    order: { name: false },
                    limit: 1000,
                  },
                },
              }).query(),

              CnHttpFactory.instance({
                path: "event_type",
                data: {
                  select: { column: ["id", "name"] },
                  modifier: {
                    order: { name: false },
                    limit: 1000,
                  },
                },
              }).query(),
            
            ]);

            this.metadata.columnList.cohort_id.enumList =
              cohortResponse.data.reduce((list, item) => {
                list.push({ value: item.id, name: item.name });
                return list;
              }, []);

            this.metadata.columnList.event_type_id.enumList =
              eventTypeResponse.data.reduce((list, item) => {
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
