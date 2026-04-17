const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_action_list } = await import(`${CENOZO_URL}/js/element/action/list.mjs`);
const { CN_modal_confirm } = await import(`${CENOZO_URL}/js/element/modal/confirm.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

const classes = await import(`${CENOZO_URL}/js/model/participant.mjs`);
const base_list_class = classes.CN_participant_list ? classes.CN_participant_list : CN_action_list;

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

export class CN_participant_list extends base_list_class {
  /**
   * Extends the parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    if ("participant" == CN_session.get_leaf_model().get_name()) {
      const update_sound_files_btn_el = this.constructor.html(
        '<button name="update_sound_files" class="btn btn-light btn-outline-primary">Update Sound Files</button>'
      );
      update_sound_files_btn_el.addEventListener("click", async () => {
        const response = await CN_modal_confirm.create_and_open({
          title: "Update Sound Files",
          message: `
            <div class="pb-2">Are you sure you wish to re-scan for new sound files?</div>
            <div>
              This process is performed automatically every night so it shouldn't be necessary to manually
              re-scan for new sound files unless you wish to find new recordings made over the last day.
            </div>
          `,
        });

        if (response) {
          await this.constructor.wait_for(async () => {
            await CN_api.count("sound_file", { update: 1 });
            await this.run();
          }, 0); // show wait-for message immediately
        }
      });
      footer_el.querySelector("div.btn-group").append(update_sound_files_btn_el);
    }

    return footer_el;
  }
}
