const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_sound_file_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "sound file",
        plural: "sound files",
        posessive: "sound file's",
      },
      columns: {
        uid: { column: "participant.uid", title: "Participant" },
        test_type: { column: "test_type.name", title: "Test Type" },
        datetime: { title: "Date & Time", type: "datetime" },
        identifying: { title: "Identifying", type: "boolean" },
      },
      properties: {
        uid: { meta: { table: "participant", column: "uid" }, title: "Participant", is_constant: () => true },
        test_type: { meta: { table: "test_type", column: "name" }, title: "Test Type", is_constant: () => true },
        name: { meta: {}, title: "Name", is_constant: () => true },
        datetime: { title: "Date & Time", type: "datetimesecond" },
        identifying: {
          title: "Identifying",
          type: "boolean",
          help: "Whether the sound file has identifying details about the participant.",
        },
        url: { meta: {}, title: "Recording", type: "audio_url" },
      },
    });
  }
}
