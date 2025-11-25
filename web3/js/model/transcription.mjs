const CN_session = (await import(`${CENOZO_URL}/js/session.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);

export class CN_transcription_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "transcription",
        plural: "transcriptions",
        posessive: "transcription's",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        cohort: { column: "cohort.name", title: "Cohort" },
        user: {
          column: "user.name",
          title: "Assigned",
          is_hidden: () => "typist" == CN_session.data.role.name,
          help: "Which user the transcription is assigned to",
        },
        user_list: {
          title: "User List",
          table_prefix: false,
          is_hidden: () => "typist" == CN_session.data.role.name,
          help: "Which users have worked with at least one test-entry, ordered by first access date",
        },
        language_list: {
          title: "Language List",
          table_prefix: false,
          help: "Which languages the transcription has been associated with (based on all test-entries)",
        },
        site: {
          column: "site.name",
          title: "Credited Site",
          is_hidden: () => "typist" == CN_session.data.role.name,
        },
        state: {
          title: "State",
          table_prefix: false,
          is_hidden: () => "typist" == CN_session.data.role.name,
          help: 'One of "assigned", "deferred" or "completed"',
        },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: {
          title: "End",
          type: "datetimesecond",
          help: "Only set once all test entries have been submitted",
        },
      },
    });
  }
}
