cenozoApp.defineModule({
  name: "test_entry_activity",
  models: ["list", "view"],
  create: (module) => {
    angular.extend(module, {
      identifier: {
        parent: {
          subject: "test_entry",
          column: "test_entry_id",
        },
      },
      name: {
        singular: "test entry activity",
        plural: "test entry activities",
        possessive: "test entry activity's",
      },
      columnList: {
        user: {
          column: "user.name",
          title: "User",
        },
        start_datetime: {
          title: "Start",
          type: "datetimesecond",
        },
        end_datetime: {
          title: "End",
          type: "datetimesecond",
        },
      },
      defaultOrder: {
        column: "start_datetime",
        reverse: true,
      },
    });
  },
});
