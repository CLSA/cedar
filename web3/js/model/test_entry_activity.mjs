const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_model_test_entry_activity extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "test entry activity",
        plural: "test entry activitys",
        posessive: "test entry activity's",
      },
      columns: {
        user: { column: "user.name", title: "User" },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: { title: "End", type: "datetimesecond" },
      },
    });
  }
}
