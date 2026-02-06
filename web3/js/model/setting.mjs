const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const classes = await import(`${CENOZO_URL}/js/model/setting.mjs`);

export class CN_setting_model extends classes.CN_setting_model {
  /**
   * Extends parent method
   */
  clone_columns() {
    const columns = super.clone_columns();
    columns.max_working_transcriptions = {
      title: "Max Transcriptions",
      type: "number",
      help: "The maximum number of transcriptions a typist may work on at one time.",
    };
    return columns;
  }

  /**
   * Extends parent method
   */
  clone_properties() {
    const properties = super.clone_properties();
    properties.max_working_transcriptions = {
      title: "Max Working Transcriptions",
      format: "integer",
      help:
        "The maximum number of transcriptions a typist may work on at one time.  Note that typist " +
        "may get beyond than this limit as a result of deferred transcriptions being returned to " +
        "their working list.",
    };
    return properties;
  }
}
