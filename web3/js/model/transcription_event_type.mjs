const { CN_model_base } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_model_transcription_event_type extends CN_model_base {
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
