const CN_session = (await import(`${CENOZO_URL}/js/session.mjs`)).default;

const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);

export class CN_test_entry_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "test entry",
        plural: "test entries",
        posessive: "test entry's",
      },
      columns: {
        transcription_uid: {
          column: "participant.uid",
          title: "UID",
          is_hidden: (model) => "transcription" == model.get_parent_model().get_name(),
        },
        test_type_name: { column: "test_type.name", title: "Type" },
        user_list: {
          title: "User List",
          table_prefix: false,
          is_hidden: () => "typist" == CN_session.data.role.name,
          help: "Which users have worked with the test-entry, ordered by first access date",
        },
        language_list: {
          title: "Language List",
          table_prefix: false,
          help: "Which languages the test entry has been associated with",
        },
        state: { title: "State" },
      },
    });
  }

  /**
   * Never allow word to choose test-entries
   */
  allow_choose() {
    return super.allow_choose() && "word" != this.get_parent_model().get_name();
  }
}
