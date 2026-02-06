const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_transcription_event_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "transcription event type",
        plural: "transcription event types",
        posessive: "transcription event type's",
      },
      columns: {
        cohort: { column: "cohort.name", title: "Cohort" },
        event_type: { column: "event_type.name", title: "Event Type" },
      },
      properties: {
        cohort_id: { title: "Cohort", type: "enum", enum: { path: "cohort" } },
        event_type_id: { title: "Event Type", type: "enum", enum: { path: "event_type" } },
      },
    });
  }
}
