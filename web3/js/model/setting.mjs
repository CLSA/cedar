const classes = await import(`${CENOZO_URL}/js/model/setting.mjs`);

export class CN_model_setting extends classes.CN_model_setting {
  /**
   * Extends parent method
   */
  clone_columns() {
    const columns = super.clone_columns();
    columns.max_working_transcriptions = {
      title: "Max Transcriptions",
      type: "integer",
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
