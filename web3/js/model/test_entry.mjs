const { CN_action_notes } = await import(`${CENOZO_URL}/js/action/notes.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/action/view.mjs`);
const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_common } = await import(`${CENOZO_URL}/js/common.mjs`);
const { CN_element_loading_box } = await import(`${CENOZO_URL}/js/element/loading_box.mjs`);
const { CN_modal_confirm } = await import(`${CENOZO_URL}/js/modal/confirm.mjs`);
const { CN_modal_input } = await import(`${CENOZO_URL}/js/modal/input.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/modal/message.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

export class CN_model_test_entry extends CN_base_model {
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
          is_hidden: () => "transcription" == this.get_parent_model().get_name(),
        },
        test_type_name: { column: "test_type.name", title: "Type" },
        user_list: {
          title: "User List",
          table_prefix: false,
          is_hidden: () => "typist" == CN_session.get("role", "name"),
          help: "Which users have worked with the test-entry, ordered by first access date.",
        },
        language_list: {
          title: "Language List",
          table_prefix: false,
          help: "Which languages the test entry has been associated with.",
        },
        state: { title: "State" },
        score: {
          title: "Score",
          type: "integer",
          is_hidden: () => "typist" == CN_session.get("role", "name"),
        },
        alt_score: {
          title: "Alt Score",
          type: "integer",
          is_hidden: () => "typist" == CN_session.get("role", "name"),
        },
      },
      properties: {
        data_type: { meta: { table: "test_type", column: "data_type" } },
        state: { type: "enum" },
        participant_language_id: { meta: { table: "participant", column: "language_id" } },
        prev_test_entry_id: { meta: {} },
        next_test_entry_id: { meta: {} },

        // used by the data type test actions
        audio_status_type_id: {},
        audio_status_type_other: {},
        participant_status_type_id: {},
        participant_status_type_other: {},
        admin_status_type_id: {},
        admin_status_type_other: {},
      },
    });
  }

  /**
   * Extend parent method
   */
  allow_choose() {
    // Never allow word to choose test-entries
    return super.allow_choose() && "word" != this.get_parent_model().get_name();
  }

  /**
   * Extend parent method
   */
  allow_edit() {
    const action = this.get_action();
    return (
      super.allow_edit() &&
      (
        "typist" != CN_session.get("role", "name") || (
          "assigned" == action.get_property_value("state") &&
          "Unusable" != action.get_property_value("audio_status") &&
          "Unavailable" != action.get_property_value("audio_status") &&
          "Refused" != action.get_property_value("participant_status")
        )
      ) &&
      action.get_property_value("data_type") &&
      (action.get_data_model().allow_edit() || action.get_data_model().allow_add())
    );
  }
}

export class CN_notes_test_entry extends CN_action_notes {
  constructor(parent_el, model) {
    super(parent_el, model);
    this.set_footer_at_top(false);
    this.set_note_module_name("test_entry_note");
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    const model = this.get_model();

    if (["crumb", "header"].includes(type)) {
      return (await CN_api.get(model.get_view_url(null, "api"), {
        select: { column: { table: "test_type", column: "name" } },
      })).name;
    }

    return await super.get_text(type);
  }
}

export class CN_view_test_entry extends CN_action_view {
  #test_type;
  #data_model;
  #state_btn_el;
  #reset_btn_el;

  /**
   * Extend parent method
   */
  get_data_model() {
    return this.#data_model;
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    const model = this.get_model();

    if (["crumb", "header"].includes(type)) {
      let name = this.#test_type ? this.#test_type.name : this.get_property_value("data_type");
      if ("header" == type && !this.get_model().allow_edit()) name += " (read-only)";
      return name;
    }

    return await super.get_text(type);
  }

  /**
   * Extend parent method
   */
  set_disabled(disabled) {
    if (this.#data_model) this.#data_model.get_action().set_disabled(disabled);

    const state = this.get_property_value("state");
    if (this.#state_btn_el) {
      this.constructor.set_disabled(
        this.#state_btn_el,
        "assigned" != state && "typist" == CN_session.get("role", "name")
      );
    }
    if (this.#reset_btn_el) {
      this.constructor.set_disabled(
        this.#reset_btn_el,
        disabled || ("assigned" != state && "typist" == CN_session.get("role", "name"))
      );
    }
  }

  /**
   * Extend parent method
   */
  async on_dom_remove() {
    // remove the data model's action before removing from the DOM
    this.get_body_element().innerHTML = "";

    await super.on_dom_remove();
  }

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
      if (0 == response.length || CN_session.get("user", "id") != response[0].user_id) {
        const note = await CN_modal_input.create_and_open({
          title: "Test Entry Note",
          message: "Please provide the reason you are changing the test entry's state.",
          input: {
            type:"text",
            min_length: 10,
          },
        });

        if (undefined === note) return;

        await CN_api.post(`${test_entry_path}/test_entry_note`, {
          user_id: CN_session.get("user", "id"),
          note: note,
        });
      }
    }

    const disabled = this.get_disabled();
    try {
      if (!disabled) this.set_disabled(true);
      await CN_api.patch(test_entry_path, { state: state });
      if ("assigned" != state && "typist" == CN_session.get("role", "name")) {
        await this.transition("next");
      } else {
        await this.run();
      }
    } catch (error) {
      if (CN_common.is_uri_error(error, 409)) {
        await CN_modal_message.create_and_open({
          header_class: "text-bg-danger",
          title: "Conflict",
          message: "The test-entry cannot be submitted if it " + (
            "aft" == this.#test_type.data_type || "fas" == this.#test_type.data_type ?
            "contains invalid words or placeholders." :
            "rey" == this.#test_type.data_type ?
            "contains invalid words or there is missing data." :
            "is missing data."
          ),
        });
      } else {
        throw error;
      }
    } finally {
      if (!disabled) this.set_disabled(false);
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
      if (CN_common.is_uri_error(error, 403)) {
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

    const body_el = this.get_body_element();
    if (this.#data_model && 0 == body_el.children.length) {
      body_el.append(this.#data_model.get_element());
    }

    const footer_el = this.get_footer_element();
    const role = CN_session.get("role", "name");
    const state = this.get_property_value("state");
    const options = [];
    if ("assigned" == state) {
      options.push({ name: "deferred", title: "Defer" });
      options.push({
        name: "submitted",
        title: "typist" == role ? "Submit" : "Force Submit"
      });
    } else if ("deferred" == state) {
      options.push({ name: "assigned", title: "Return to Typist" });
      options.push({ name: "submitted", title: "Force Submit" });
    } else if ("submitted" == state) {
      options.push({ name: "assigned", title: "Un-submit and Return to Typist" });
      options.push({ name: "deferred", title: "Un-submit and Defer" });
    }

    const dropdown_el = footer_el.querySelector("ul.dropdown-menu");
    if (this.#state_btn_el) {
      this.#state_btn_el.innerHTML = `State: ${CN_common.uc_words(state)}`;
      dropdown_el.innerHTML = "";
      options.forEach(option => {
        dropdown_el.append(this.constructor.html(
          `<li><button name="${option.name}" type="button" class="dropdown-item">${option.title}</button></li>`
        ))
        const btn_el = dropdown_el.querySelector(`button[name=${option.name}]`);
        btn_el.addEventListener("click", this.set_state.bind(this, option.name, "deferred" == option.name));
      });
    }

    // only enabled for typists
    this.set_disabled("typist" != role || "assigned" != state);
  }

  /**
   * Replace parent method
   */
  _create_placeholder_element() {
    return CN_element_loading_box.create();
  }

  /**
   * Replace parent method
   */
  _create_body_element() {
    return this.constructor.html("<div></div>");
  }

  /**
   * Extends parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const right_btn_group_el = footer_el.querySelector("div[name=right-btn-group]");
    const left_btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    // add the prev/next test-entry buttons
    const prev_btn_el = this.constructor.html(`
      <button name="prev" type="button" class="btn btn-primary">
        <i class="bi bi-chevron-left"></i> Prev
      </button>
    `);
    prev_btn_el.addEventListener("click", this.transition.bind(this, "prev"));
    right_btn_group_el.prepend(prev_btn_el);

    const next_btn_el = this.constructor.html(`
      <button name="next" type="button" class="btn btn-primary">
        Next <i class="bi bi-chevron-right"></i>
      </button>
    `);
    next_btn_el.addEventListener("click", this.transition.bind(this, "next"));
    right_btn_group_el.append(next_btn_el);

    // add the state, reset and notes buttons
    left_btn_group_el.append(this.constructor.html(`
      <div class="btn-group" role="group">
        <button name="state" type="button" class="btn btn-warning dropdown-toggle" data-bs-toggle="dropdown">
        </button>
        <ul class="dropdown-menu"></ul>
      </div>
    `));
    this.#state_btn_el = footer_el.querySelector("button[name=state]");

    this.#reset_btn_el = this.constructor.html(
      '<button name="reset" type="button" class="btn btn-danger">Reset</button>'
    );
    this.#reset_btn_el.addEventListener("click", async () => {
      const response = await CN_modal_confirm.create_and_open({
        title: "Reset Entry",
        message: "Are you sure you wish to reset the entry?",
      });

      if (response) {
        await CN_api.patch(`test_entry/${this.get_model().get_identifier()}?reset=1`, {});
        await this.run();
      }
    });
    left_btn_group_el.append(this.#reset_btn_el);

    const notes_btn_el = this.constructor.html(
      '<button name="notes" type="button" class="btn btn-light btn-outline-primary">Notes</button>'
    );
    notes_btn_el.addEventListener(
      "click",
      CN_session.navigate_to.bind(
        CN_session,
        this.get_model().get_view_url().replace(/test_entry\/view/, "test_entry/notes")
      )
    );
    left_btn_group_el.append(notes_btn_el);

    return footer_el;
  }

  /**
   * Replace parent method
   */
  async run(children = false) {
    const model = this.get_model();
    if (null == model.get_action_name()) return;

    // create and configure the data model
    if (!this.#data_model) {
      // get the data type
      this.#test_type = await CN_api.get(model.get_view_url(null, "api"), {
        select: {
          column: [
            { table: "test_type", column: "data_type" },
            { table: "test_type", column: "name" },
          ],
        },
      });

      const data_module = CN_session.get_module(`${this.#test_type.data_type}_data`);
      await data_module.load_classes();
      this.#data_model = data_module.create_model();

      if (model.is_rendered()) {
        // note that we set the identifier to an empty string because data models are customized to not use them
        await this.#data_model.configure(this.get_body_element(), "test", null, model, true);
      }
    }

    const data_action = this.#data_model.get_action();

    this.on_pre_loading();
    // the data action doesn't have a placeholder

    await this.on_load();
    await data_action.on_load();

    this.on_post_loading();
    data_action.on_post_loading();

    if (model.is_rendered()) {
      this.update_element();
      data_action.update_element();
    }

    if (model.is_rendered() && children) {
      // run all children as well
      model.get_child_model_list().forEach(model => model.run());
    }
  }
}
