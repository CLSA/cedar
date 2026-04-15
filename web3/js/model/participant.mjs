const classes = await import(`${CENOZO_URL}/js/model/participant.mjs`);
export class CN_participant_model extends classes.CN_participant_model {
  /** 
   * Extends parent method
   */
  clone_columns() {
    const columns = super.clone_columns();

    // remove the note column and add the transcription state, start and end columns
    delete columns.global_note;
    columns.state = { title: "State", table_prefix: false };
    columns.start_datetime = {
      column: "transcription.start_datetime",
      title: "Start",
      type: "datetime",
      help: "When the participant's transaction began.",
    };
    columns.end_datetime = {
      column: "transcription.end_datetime",
      title: "End",
      type: "datetime",
      help: "When the participant's transaction ended.",
    };

    return columns;
  }
}
