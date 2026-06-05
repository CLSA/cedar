const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_action_list } = await import(`${CENOZO_URL}/js/action/list.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/action/view.mjs`);
const { CN_base_action } = await import(`${CENOZO_URL}/js/action/base_action.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_element_card } = await import(`${CENOZO_URL}/js/element/card.mjs`);
const { CN_element_label } = await import(`${CENOZO_URL}/js/element/label.mjs`);
const { CN_input_enum } = await import(`${CENOZO_URL}/js/input/enum.mjs`);
const { CN_modal_confirm } = await import(`${CENOZO_URL}/js/modal/confirm.mjs`);
const { CN_modal_message } = await import(`${CENOZO_URL}/js/modal/message.mjs`);
const { CN_element_participant_selection }  = await import(`${CENOZO_URL}/js/model/participant.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

export class CN_model_transcription extends CN_base_model {
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
          is_hidden: () => "typist" == CN_session.get("role", "name"),
          help: "Which user the transcription is assigned to",
        },
        user_list: {
          title: "User List",
          table_prefix: false,
          is_hidden: () => "typist" == CN_session.get("role", "name"),
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
          is_hidden: () => "typist" == CN_session.get("role", "name"),
        },
        state: {
          title: "State",
          table_prefix: false,
          is_hidden: () => "typist" == CN_session.get("role", "name"),
          help: 'One of "assigned", "deferred" or "completed"',
        },
        start_datetime: { title: "Start", type: "datetimesecond" },
        end_datetime: {
          title: "End",
          type: "datetimesecond",
          help: "Only set once all test entries have been submitted",
        },
      },
      properties: {
        uid: {
          meta: { table: "participant", column: "uid" },
          title: "Participant",
          is_constant: () => true,
          is_hidden: model => "add" == model.get_action_name(),
        },
        user_id: {
          title: "User",
          type: "enum",
          enum: {
            path: "user",
            get_enums: async () => {
              const user_list = await CN_api.get( "user", {
                select: { distinct: true, column: ["id", "name", "first_name", "last_name"] },
                modifier: {
                  join: [
                    { table: "access", onleft: "user.id", onright: "access.user_id" },
                    { table: "role", onleft: "access.role_id", onright: "role.id" },
                  ],
                  where: [
                    { column: "role.name", operator: "=", value: "typist" },
                  ],
                  order: "user.name",
                },
              });
              return user_list.map(u => ({ key: u.id, value: `${u.first_name} ${u.last_name} (${u.name})` }));
            },
          },
          is_hidden: () => "typist" == CN_session.get("role", "name"),
          help: "Which user the transcription is assigned to",
        },
        site_id: {
          title: "Credited Site",
          type: "enum",
          enum: { path: "site" },
          is_constant: () => 3 > CN_session.get("role", "tier"),
          is_hidden: model => "add" == model.get_action_name(),
        },
        state: {
          meta: {},
          title: "State",
          is_constant: () => true,
          is_hidden: model => "add" == model.get_action_name(),
          help: 'One of "assigned", "deferred" or "completed"',
        },
        start_datetime: {
          meta: {},
          title: "Start Date & Time",
          type: "datetimesecond",
          is_constant: () => true,
          is_hidden: model => "add" == model.get_action_name(),
        },
        end_datetime: {
          meta: {},
          title: "End Date & Time",
          type: "datetimesecond",
          is_constant: () => true,
          is_hidden: model => "add" == model.get_action_name(),
          help: 'Only set when the state is "completed"',
        },
      },
    });
  }

  /**
   * Extend parent method
   */
  allow_add() {
    const records = (
      "list" == this.get_action_name() ?
      this.get_action().get_record_count() :
      null
    );
    if ("typist" == CN_session.get("role", "name")) {
      const leaf_model = CN_session.get_leaf_model();
      return (
        super.allow_add() &&
        null != leaf_model &&
        "transcription" == leaf_model.get_name() &&
        "list" == leaf_model.get_action_name() &&
        null != records &&
        CN_session.get("setting", "max_working_transcriptions") > records
      );
    } else {
      const parent_model = this.get_parent_model();
      return super.allow_add() && (
        null != parent_model &&
        ("participant" == parent_model.get_name() && 0 == records) ||
        ("add" == this.get_action_name())
      );
    }

    return false;
  }
}

export class CN_multiedit_transcription extends CN_base_action {
  #restriction_form_input;
  #site_form_input;
  #user_form_input;
  #user_warning_el;
  #proceed_btn_el;

  #import_restrictions = [{
    key: "no-import",
    value: "NO-IMPORT: Participants already available to the application",
  }, {
    key: "import",
    value: "IMPORT-ONLY: Participants who are not available to the application (all will be imported)",
  }, {
    key: "any",
    value: "ANY: Do not restrict participants (unavailable participants will be imported)",
  }];
  #participant_selection = new CN_element_participant_selection(null, {
    path: "transcription",
    data: { import_restriction: this.#import_restrictions[0].key },
  });

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(parent_el, model) {
    super("multiedit", parent_el, model);
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return "Multi-Edit";
    }

    if ("header" == type) {
      return "Transcription Multi-Edit";
    }

    return super.get_text(type);
  }

  /**
   * Extend parent method
   */
  async on_navigate_to_parent() {
    await CN_session.navigate_to(this.get_model().get_view_url());
  }

  /**
   * Extend parent method
   */
  async on_load() {
    await super.on_load();

    // reset the list and transcription components
    this.#participant_selection.reset();
  }

  /**
   * Extend parent method
   */
  update_element() {
    if (this.#restriction_form_input) {
      const restriction_type = this.#restriction_form_input.get_value();
      if (this.#user_form_input) {
        this.constructor.set_disabled(
          this.#proceed_btn_el,
          "no-import" == restriction_type && !this.#user_form_input.get_value()
        );
      }

      if (this.#user_warning_el) {
        // show or hide the user warning based on the selected restriction type
        if ("no-import" == restriction_type) {
          this.#user_warning_el.classList.add("d-none");
        } else {
          this.#user_warning_el.classList.remove("d-none");
        }
      }
    }
  }

  /**
   * Extend parent method
   */
  _create_body_element() {
    const body_el = this.constructor.html(`
      <div class="container-fluid text-info-emphasis">
        <div class="pb-2">
          In order to edit multiple transcriptions at once you must first select them by participant UID.
          You may enter the unique identifiers (eg: A123456) of all transcriptions you wish to affect, then
          confirm that list to ensure each of the identifiers can be linked to a participant.
        </div>
        <div class="pb-2">
          This utility allows you to affect transcriptions in one of two ways:
          <ol class="text-info">
            <li>Reassigning multiple transcriptions to a typist</li>
            <li>Import participants who do not have any recordings (and alternatively assign them to a typist)</li>
          </ol>
          Any existing transcriptions which are complete will be refused (you must return at least one test-entry
          to the typist before it can be re-assigned.
        </div>
        <div name="participant-list" class="py-1"></div>
        <div name="transcription-assignment" class="py-1 d-none"></div>
      </div>
    `);

    this.#participant_selection.add_event_listener("selectionchanged", () => {
      this.update_element();
      const assignment_el = body_el.querySelector("[name=transcription-assignment]");
      if (this.#participant_selection.get_identifier_list().length) {
        assignment_el.classList.remove("d-none");
      } else {
        assignment_el.classList.add("d-none");
      }
    });

    const restrict_row_el = this.constructor.html('<div class="row"></div>');

    CN_element_label.append(restrict_row_el, {
      for: "import_restriction",
      value: "Restrict to",
      class: "col-sm-3",
    });
    this.#restriction_form_input = new CN_input_enum(restrict_row_el, {
      id: "import_restriction",
      class: "col-sm-9",
      required: true,
      get_default: () => "no-import",
      enum: { values: this.#import_restrictions },
      on_change: (form_input) => {
        // set the import_restriction data when the dropdown changes
        this.#participant_selection.reset_confirmation();
        this.#participant_selection.set_config("data", { import_restriction: form_input.get_value() });
      },
    });
    restrict_row_el.append(this.#restriction_form_input.get_element());

    const participant_list_el = body_el.querySelector("[name=participant-list]");
    this.#participant_selection.set_parent_element(participant_list_el);
    participant_list_el.append(this.#participant_selection.get_element());
    this.#participant_selection.get_element().querySelector(".card-footer").prepend(restrict_row_el);

    const assignment_body_el = this.constructor.html('<div class="row"></div>');
    CN_element_label.append(assignment_body_el, {
      for: "site_id",
      value: "Assign to Site",
      class: "col-sm-3",
    });
    this.#site_form_input = new CN_input_enum(assignment_body_el, {
      id: "site_id",
      class: "col-sm-9",
      get_default: () => null,
      enum: {
        get_enums: async () => (
          await CN_api.get("site", { select: { column: ["id", "name"] } })
        ).map(site => ({ key: site.id, value: site.name })),
      },
      on_change: async (form_input) => {
        // update the user dropdown to update its enum list
        this.#user_form_input.set_value(null);
        await this.#user_form_input.update();
        this.update_element();
      },
    });
    assignment_body_el.append(this.#site_form_input.get_element());

    CN_element_label.append(assignment_body_el, {
      for: "user_id",
      value: "Assign to User",
      class: "col-sm-3",
    });
    const user_el = this.constructor.html('<div class="col-sm-9"></div>');
    assignment_body_el.append(user_el);
    this.#user_form_input = new CN_input_enum(user_el, {
      id: "user_id",
      get_default: () => null,
      enum: {
        get_enums: async (form_input) => (
          await CN_api.get("user", {
            select: { column: ["id", "name", "first_name", "last_name"] },
            modifier: {
              join: [
                { table: "access", onleft: "user.id", onright: "access.user_id" },
                { table: "role", onleft: "access.role_id", onright: "role.id" },
              ],
              where: [
                { column: "access.site_id", operator: "=", value: this.#site_form_input.get_value() },
                { column: "role.name", operator: "=", value: "typist" },
                { column: "user.active", operator: "=", value: true },
              ],
              order: "user.name",
            },
          })
        ).map(user => ({
          key: user.id,
          value: `${user.first_name} ${user.last_name} (${user.name})`,
        })),
      },
      on_change: () => {
        this.update_element();
      },
    });
    user_el.append(this.#user_form_input.get_element());

    this.#user_warning_el = this.constructor.html(`
      <div name="user-warning" class="text-info d-none">
        Please note that if you leave this empty then imported participants will become available in the
        application's participant list without being assigned a transcription (they will be available for
        new transcription requests).
      </div>
    `);
    user_el.append(this.#user_warning_el);

    const assignment_footer_el = this.constructor.html('<div class="row"></div>');
    this.#proceed_btn_el = this.constructor.html(
      '<button name="proceed" type="button" class="btn btn-primary">Proceed</button>'
    );
    this.#proceed_btn_el.addEventListener("click", async () => {
      const identifier_list = this.#participant_selection.get_identifier_list();

      let response = null;
      await this.constructor.wait_for(async () => {
        response = await CN_api.post("transcription", {
          identifier_id: this.#participant_selection.get_idtype(),
          identifier_list: identifier_list,
          site_id: await this.#site_form_input.get_value_for_record(),
          user_id: await this.#user_form_input.get_value_for_record(),
          process: true,
        });
      });

      let message = `A total of ${identifier_list.length} transcription(s) have been processed`;
      const user_name = this.#user_form_input.get_value_label();
      if (user_name) message += ` and assigned to user "${user_name}"`;
      const site_name = this.#site_form_input.get_value_label();
      if (site_name) message += ` at site "${site_name}"`;

      await CN_modal_message.create_and_open({ title: "Transcription(s) Processed", message: message });
      await this.#participant_selection.reset();
    });
    assignment_footer_el.append(this.#proceed_btn_el);

    CN_element_card.append(body_el.querySelector("[name=transcription-assignment]"), {
      header: "Transcription Assignment",
      body: assignment_body_el,
      footer: assignment_footer_el,
    });

    return body_el;
  }

  /**
   * Extend parent method
   */
  _create_footer_element() {
    const footer_el = this.constructor.html(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Application</button>
      </div>
    `);
    footer_el.querySelector("button[name=back]").addEventListener("click", this.on_navigate_to_parent.bind(this));
    return footer_el;
  }
}

export class CN_list_transcription extends CN_action_list {
  /**
   * Extends the parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const btn_group_el = footer_el.querySelector("div.btn-group");
    const leaf_model = CN_session.get_leaf_model();

    if (
      leaf_model &&
      "transcription" == leaf_model.get_name() &&
      this.get_model().get_module().action_allowed("multiedit")
    ) {
      const multiedit_btn_el = this.constructor.html(
        '<button name="multiedit" type="button" class="btn btn-light btn-outline-primary">Multi-Edit</button>'
      );
      multiedit_btn_el.addEventListener("click", () => {
        CN_session.navigate_to("transcription/multiedit");
      });
      btn_group_el.append(multiedit_btn_el);
    }

    if (2 < CN_session.get("role", "tier") && "transcription" == CN_session.get_leaf_model().get_name()) {
      const rescore_btn_el = this.constructor.html(
        '<button name="rescore" type="button" class="btn btn-light btn-outline-primary">Rescore All</button>'
      );
      rescore_btn_el.addEventListener("click", async () => {
        const response = await CN_modal_confirm.create_and_open({
          title: "Rescore All Test Entries",
          message: `
            <div class="pb-2">Are you sure you wish to re-score all test entries?</div>
            <div>
              This process is processor-intensive and may slow down the application for all
              users while scores are being re-calculated.  You should only continue if it is
              necessary for tests to be re-scored immediately.
            </div>
          `,
        });

        if (response) {
          this.constructor.set_disabled(rescore_btn_el, true);
          await this.constructor.wait_for(
            async () => await CN_api.count("transcription", { rescore: 1 }),
            0, // show wait-for message immediately
          );
          this.constructor.set_disabled(rescore_btn_el, false);
        }
      });
      btn_group_el.append(rescore_btn_el);
    }

    return footer_el;
  }
}

export class CN_view_transcription extends CN_action_view {
  /**
   * Extends the parent method
   */
  async get_text(type) {
    if (["crumb", "name"].includes(type)) {
      await this.after_first_load();
      return this.get_property_value("uid");
    }
    return await super.get_text(type);
  }

  /**
   * Extends the parent method
   */
  _create_footer_element() {
    const footer_el = super._create_footer_element();
    const btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    if (2 < CN_session.get("role", "tier")) {
      const rescore_btn_el = this.constructor.html(
        '<button name="rescore" type="button" class="btn btn-light btn-outline-primary">Rescore</button>'
      );
      rescore_btn_el.addEventListener("click", async () => {
        this.constructor.set_disabled(rescore_btn_el, true);
        await this.constructor.wait_for(
          async () => await CN_api.count(this.get_model().get_view_url(null, "api"), { rescore: 1 }),
        );
        this.constructor.set_disabled(rescore_btn_el, false);
        this.get_model().get_child_model_list()
          .filter(child_model => "test_entry" == child_model.get_name())
          .forEach(child_model => child_model.run());
      });
      btn_group_el.append(rescore_btn_el);
    }

    return footer_el;
  }
}
