const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

const { CN_action_view } = await import(`${CENOZO_URL}/js/element/action/view.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_element_loading_box } = await import(`${CENOZO_URL}/js/element/loading_box.mjs`);
const { CN_modal_input } = await import(`${CENOZO_URL}/js/element/modal/input.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/element/modal/message.mjs`);

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
      properties: {
        user_id: { meta: { table: "transcription", column: "user_id" } },
        test_type_id: { meta: { table: "test_type", column: "id" } },
        test_type_name: { meta: { table: "test_type", column: "name" } },
        data_type: { meta: { table: "test_type", column: "data_type" } },
        state: { type: "enum" },
        audio_status_type_id: {},
        audio_status_type: { meta: { table: "audio_status_type", column: "name" } },
        audio_status_type_other: {},
        participant_status_type_id: {},
        participant_status_type: { meta: { table: "participant_status_type", column: "name" } },
        participant_status_type_other: { },
        admin_status_type_id: {},
        admin_status_type: { meta: { table: "admin_status_type", column: "name" } },
        admin_status_type_other: {},
        participant_site_id: { meta: { table: "site", column: "id" } },
        participant_language_id: { meta: { table: "participant", column: "language_id" } },
        prev_test_entry_id: { meta: {} },
        next_test_entry_id: { meta: {} },
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

export class CN_test_entry_view extends CN_action_view {
  #data_model = null;
  #data_id = null

  // TODO: update the data_model's action after the test-entry's language list changes

  /**
   * Sets the state of a test entry
   * @param string state: One of "assigned", "deferred" or "submitted"
   * @param boolean force_note: Will make sure the last note was left by the current user
   */
  async set_state(state, force_note = false) {
    const test_entry_path = `test_entry/${this.get_model().get_identifier()}`;
    if (force_note) {
      // force a new message if the last one wasn't left by the current user
      const response = await CN_api.get(`${test_entry_path}/test_entry_note`, {
        select: { column: "user_id" },
        modifier: { order: { "test_entry_note.datetime": true }, limit: 1 },
      });

      // don't proceed until the last note left was left by the current user
      if (0 == response.length || CN_session.data.user.id != response[0].user_id) {
        const note = await (new CN_modal_input({
          input: "text",
          min_length: 10,
          title: "Test Entry Note",
          message: "Please provide the reason you are changing the test entry's state.",
        })).open();

        if (undefined === note) return;

        await CN_api.post(`${test_entry_path}/test_entry_note`, {
          user_id: CN_session.data.user.id,
          note: note,
        });
      }
    }

    // TODO: disable the working elements
    try {
      await CN_api.patch(test_entry_path, { state: state });
      if ("assigned" != state && "typist" == CN_session.data.role.name) {
        await this.transition("next");
      } else {
        await this.run();
      }
    } catch (error) {
      if (409 == error.response.status) {
        await (new CN_modal_message({
          title: "Conflict",
          message: "The test-entry cannot be submitted if it " + (
            "aft" == self.record.data_type || "fas" == self.record.data_type ?
            "contains invalid words or placeholders." :
            "rey" == self.record.data_type ?
            "contains invalid words or there is missing data." :
            "is missing data."
          ),
          type: "danger",
        })).open();
      } else {
        throw error;
      }
    } finally {
      // TODO: enable the working elements
    }
  }

  /**
   * Moves to the previous or next test entry
   * @param string direction: Either "previous" or "next"
   */
  async transition(direction) {
    const new_test_entry_column = `${"next" == direction ? "next" : "prev"}_test_entry_id`;
    const new_test_entry_id = this.get_property_value(new_test_entry_column);
    try {
      // we still have access to the transcription so go to the next test-entry or parent transcription
      await (
        new_test_entry_id ?
        CN_session.navigate_to(this.get_model().get_view_url(new_test_entry_id)) :
        this.on_navigate_to_parent()
      );
    } catch (error) {
      if (403 == error.response.status) {
        // 403 means the user no longer has access to the transcription, so go back to the list instead
        await this.on_navigate_to_parent();
      } else {
        throw error;
      }
    }
  }

  /**
   * Replace parent method
   */
  update_element() {
    super.update_element();

    const footer_el = this.get_footer_element();
    const state = this.get_property_value("state");
    const options = [];
    if ("assigned" == state) {
      options.push({ name: "deferred", title: "Defer" });
      options.push({ name: "submitted", title: "Force Submit" });
    } else if ("deferred" == state) {
      options.push({ name: "assigned", title: "Return to Typist" });
      options.push({ name: "submitted", title: "Force Submit" });
    } else if ("submitted" == state) {
      options.push({ name: "assigned", title: "Un-submit and Return to Typist" });
      options.push({ name: "deferred", title: "Un-submit and Defer" });
    }

    const state_btn_el = footer_el.querySelector("button[name=state]");
    const dropdown_el = footer_el.querySelector("ul.dropdown-menu");
    if (state_btn_el) {
      state_btn_el.innerHTML = `State: ${CN_common.uc_words(state)}`;
      dropdown_el.innerHTML = "";
      options.forEach(option => {
        dropdown_el.append(this.constructor.html(
          `<li><button name="${option.name}" type="button" class="dropdown-item">${option.title}</button></li>`
        ))
        const btn_el = dropdown_el.querySelector(`button[name=${option.name}]`);
        btn_el.addEventListener("click", this.set_state.bind(this, option.name, true));
      });
    }
  }

  /**
   * Replace parent method
   */
  create_placeholder_element() {
    return CN_element_loading_box.create();
  }

  /**
   * Replace parent method
   */
  create_body_element() {
    // add the data model's action as part of the test-entry's body element
    return this.#data_model.render();
  }

  /**
   * Extends parent method
   */
  create_footer_element() {
    const footer_el = this.constructor.html('<div></div>');

    // add the prev/next test-entry buttons
    const nav_btn_group_el = super.create_footer_element();
    const prev_btn_el = this.constructor.html(`
      <button name="prev" type="button" class="btn btn-primary">
        <i class="bi-chevron-left"></i> Prev
      </button>
    `);
    prev_btn_el.addEventListener("click", this.transition.bind(this, "prev"));
    nav_btn_group_el.prepend(prev_btn_el);
    const next_btn_el = this.constructor.html(`
      <button name="next" type="button" class="btn btn-primary">
        Next <i class="bi-chevron-right"></i>
      </button>
    `);
    next_btn_el.addEventListener("click", this.transition.bind(this, "next"));
    nav_btn_group_el.append(next_btn_el);
    footer_el.append(nav_btn_group_el);

    // add the state, reset and notes buttons
    const command_btn_group_el = this.constructor.html(`
      <div class="btn-group ms-3" role="group">
        <div class="btn-group" role="group">
          <button name="state" type="button" class="btn btn-warning dropdown-toggle" data-bs-toggle="dropdown">
          </button>
          <ul class="dropdown-menu"></ul>
        </div>
        <button name="reset" type="button" class="btn btn-danger">Reset</button>
        <button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>
      </div>
    `);
    footer_el.append(command_btn_group_el);

    return footer_el;
  }

  /**
   * Extends parent model
   */
  async prepare() {
    await super.prepare();

    // create and configure the data model
    if (null == this.#data_model) {
      const model = this.get_model();

      // get the data type
      const response = await CN_api.get(model.get_view_url(null, "api"), {
        select: { column: { table: "test_type", column: "data_type" } }
      });

      const data_module = CN_session.get_module(`${response.data_type}_data`);
      await data_module.load_classes();
      this.#data_model = data_module.create_model();
      this.#data_model.configure("view", `test_entry_id=${model.get_identifier()}`, model);
    }
  }

  /**
   * Replace parent method
   */
  async run(children = false) {
    if (null == this.get_model().get_action_name()) return;

    // create and configure the data model
    if (null == this.#data_model) {
      const model = this.get_model();

      // get the data type
      const response = await CN_api.get(model.get_view_url(null, "api"), {
        select: { column: { table: "test_type", column: "data_type" } }
      });

      const data_module = CN_session.get_module(`${response.data_type}_data`);
      await data_module.load_classes();
      this.#data_model = data_module.create_model();
      this.#data_model.configure("view", `test_entry_id=${model.get_identifier()}`, model);
    }

    const data_action = this.#data_model.get_action();

    this.on_pre_loading();
    // the data action doesn't have a placeholder

    await this.on_load();
    await data_action.on_load();

    this.on_post_loading();
    data_action.on_post_loading();

    this.update_element();
    data_action.update_element();

    if (children) {
      // run all children as well
      this.get_model().get_child_model_list().forEach(model => model.run());
    }
  }
}
