const CN_api = (await import(`${CENOZO_URL}/js/api.mjs`)).default;
const CN_element = (await import(`${CENOZO_URL}/js/element.mjs`)).default;
const CN_session = (await import(`${CENOZO_URL}/js/session.mjs`)).default;

const { CN_base_action } = await import(`${CENOZO_URL}/js/base_action.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);
const { CN_participant_selection }  = await import(`${CENOZO_URL}/js/model/participant.mjs`);

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
      properties: {
        uid: {
          meta: { table: "participant", column: "uid" },
          title: "Participant",
          is_constant: () => true,
        },
        user_id: {
          title: "User",
          type: "enum",
          enum: {
            path: "user",
            get_enums: async (model) => {
              const site_id = model.get_action().get_property("site_id").state.get();
              const user_list = await CN_api.get( "user", {
                select: { column: ["id", "name", "first_name", "last_name"] },
                modifier: {
                  join: [
                    { table: "access", onleft: "user.id", onright: "access.user_id" },
                    { table: "role", onleft: "access.role_id", onright: "role.id" },
                  ],
                  where: [
                    { column: "access.site_id", operator: "=", value: site_id },
                    { column: "role.name", operator: "=", value: "typist" },
                  ],
                  order: "user.name",
                },
              });
              return user_list.map(u => ({ key: u.id, value: `${u.first_name} ${u.last_name} (${u.name})` }));
            },
          },
          is_hidden: () => "typist" == CN_session.data.role.name,
          help: "Which user the transcription is assigned to",
        },
        site_id: {
          title: "Credited Site",
          type: "enum",
          enum: { path: "site" },
          is_constant: () => 3 > CN_session.data.role.tier,
          is_hidden: () => "typist" == CN_session.data.role.name,
        },
        state: {
          meta: {},
          title: "State",
          is_constant: () => true,
          is_hidden: () => "typist" == CN_session.data.role.name,
          help: 'One of "assigned", "deferred" or "completed"',
        },
        start_datetime: {
          meta: {},
          title: "Start Date & Time",
          type: "datetimesecond",
          is_constant: () => true,
        },
        end_datetime: {
          meta: {},
          title: "End Date & Time",
          type: "datetimesecond",
          is_constant: () => true,
          help: 'Only set when the state is "completed"',
        },
      },
    });
  }
}

export class CN_transcription_multiedit extends CN_base_action {
  #import_restrictions = [{
    value: "no-import",
    text: "NO-IMPORT: Participants already available to the application",
  }, {
    value: "import",
    text: "IMPORT-ONLY: Participants who are not available to the application (all will be imported)",
  }, {
    value: "any",
    text: "ANY: Do not restrict participants (unavailable participants will be imported)",
  }];
  #participant_selection = new CN_participant_selection({
    path: "transcription",
    data: { import_restriction: this.#import_restrictions[0].value },
  });

  /**
   * Constructor
   * @param base_model model: The model that the action belongs to
   */
  constructor(model) {
    super("multiedit", model);
  }

  /**
   * Extend parent method
   */
  async get_text(type) {
    if ("crumb" == type) {
      return "Mutli-Edit";
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
    const model = this.get_model();

    // reset the list and transcription components
    this.#participant_selection.set_data({ import_restriction: this.#import_restrictions[0].value });
    this.#participant_selection.reset();
    this.get_body_element().querySelector("[name=transcription-assignment]").style.display = "none";

    // populate the site and user selection list
    const site_el = this.get_body_element().querySelector("#site_id");
    site_el.innerHTML = "";
    site_el.append(CN_element.create('<option value="null" selected>(empty)</option>'));
    const site_list = await CN_api.get( "site", { select: { column: ["id", "name"] } });
    site_list.forEach(site => {
      site_el.append(CN_element.create(`<option value="${site.id}">${site.name}</option>`));
    });

    const user_el = this.get_body_element().querySelector("#user_id");
    user_el.innerHTML = "";
    user_el.append(CN_element.create('<option value="null" selected>(empty)</option>'));
  }

  /**
   * Extend parent method
   */
  create_body_element() {
    const body_el = CN_element.create(`
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
        <div name="transcription-assignment" class="py-1" style="display: none;"></div>
      </div>
    `);

    function update_proceed_button() {
      // update proceed button enabled state based on new site selection
      const restrict_el = body_el.querySelector("#import_restriction");
      const user_el = body_el.querySelector("#user_id");
      const proceed_btn_el = body_el.querySelector("button[name=proceed]");

      // disable the proceed button if the restriction is "no-import" and there is no user selected
      if ("no-import" == restrict_el.value && "null" == user_el.value) {
        proceed_btn_el.setAttribute("disabled", true);
      } else {
        proceed_btn_el.removeAttribute("disabled");
      }
    }

    this.#participant_selection.on_selection_changed(() => {
      update_proceed_button();
      const assignment_el = body_el.querySelector("[name=transcription-assignment]");
      if (this.#participant_selection.get_identifier_list().length) {
        assignment_el.style.removeProperty("display");
      } else {
        assignment_el.style.display = "none";
      }
    });

    const participant_selection_el = this.#participant_selection.get_element();
    const restrict_row_el = CN_element.create('<div class="row"></div>');

    const restrict_label_el = CN_element.create_form_label({ for: "import_restriction", value: "Restrict to" });
    restrict_label_el.classList.add("col-sm-3");
    restrict_row_el.append(restrict_label_el);
    const restrict_element_el = CN_element.create_form_element("enum", {
      id: "import_restriction",
      required: true,
      on_change: control_el => {
        // set the import_restriction data when the dropdown changes
        this.#participant_selection.reset_confirmation();
        this.#participant_selection.set_data({ import_restriction: control_el.value } );
      },
    });
    restrict_element_el.classList.add("col-sm-9");
    this.#import_restrictions.forEach((restriction, index) => {
      restrict_element_el.querySelector("select").append(CN_element.create(
        `<option value="${restriction.value}" ${0 == index ? "selected" : ""}>${restriction.text}</option>`
      ));
      restrict_row_el.append(restrict_element_el);
    });
    participant_selection_el.querySelector(".card-footer").prepend(restrict_row_el);

    body_el.querySelector("[name=participant-list]").append(participant_selection_el);

    const assignment_body_el = CN_element.create('<div class="row"></div>');
    const site_label_el = CN_element.create_form_label({ for: "site_id", value: "Assign to Site" });
    site_label_el.classList.add("col-sm-3");
    assignment_body_el.append(site_label_el);
    const site_element_el = CN_element.create_form_element("enum", {
      id: "site_id",
      on_change: async control_el => {
        // update user list based on new site selection
        const user_el = this.get_body_element().querySelector("#user_id");

        user_el.innerHTML = "";
        user_el.append(CN_element.create('<option value="null" selected>(empty)</option>'));
        if ("null" != control_el.value) {
          const user_list = await CN_api.get( "user", {
            select: { column: ["id", "name", "first_name", "last_name"] },
            modifier: {
              join: [
                { table: "access", onleft: "user.id", onright: "access.user_id" },
                { table: "role", onleft: "access.role_id", onright: "role.id" },
              ],
              where: [
                { column: "access.site_id", operator: "=", value: control_el.value },
                { column: "role.name", operator: "=", value: "typist" },
                { column: "user.active", operator: "=", value: true },
              ],
              order: "user.name",
            },
          });
          user_list.forEach(user => {
            user_el.append(CN_element.create(
              `<option value="${user.id}">${user.first_name} ${user.last_name} (${user.name})</option>`
            ));
          });
        }
        update_proceed_button();
      },
    });
    site_element_el.classList.add("col-sm-9");
    assignment_body_el.append(site_element_el);
    const user_label_el = CN_element.create_form_label({ for: "user_id", value: "Assign to User" });
    user_label_el.classList.add("col-sm-3");
    assignment_body_el.append(user_label_el);
    const user_element_el = CN_element.create_form_element("enum", {
      id: "user_id",
      on_change: update_proceed_button,
    });
    user_element_el.classList.add("col-sm-9");
    assignment_body_el.append(user_element_el);

    const assignment_footer_el = CN_element.create('<div class="row"></div>');
    const proceed_btn_el = CN_element.create(
      '<button name="proceed" type="button" class="btn btn-primary">Proceed</button>'
    );
    proceed_btn_el.addEventListener("click", async () => {
      const site_el = this.get_body_element().querySelector("#site_id");
      const site_id = "null" == site_el.value ? null : site_el.value;
      const user_el = this.get_body_element().querySelector("#user_id");
      const user_id = "null" == user_el.value ? null : user_el.value;
      const identifier_list = this.#participant_selection.get_identifier_list();

      let response = null;
      await CN_element.wait_for(async () => {
        response = await CN_api.post("transcription", {
          identifier_id: this.#participant_selection.get_idtype(),
          identifier_list: identifier_list,
          site_id: site_id,
          user_id: user_id,
          process: true,
        });
      });

      await CN_element.message_modal({
        static: true,
        title: "Transcription(s) Processed",
        message: (
          `A total of ${identifier_list.length} transcription(s) have been processed` +
          (user_id ? ` and assigned to user "${user_el.options[user_el.selectedIndex].text}"` : "") +
          (site_id ? ` at site "${site_el.options[site_el.selectedIndex].text}"` : "" ) +
          "."
        ),
      }).block();

      await this.#participant_selection.reset();
    });
    assignment_footer_el.append(proceed_btn_el);

    const assignment_el = CN_element.create_card({
      header: "Transcription Assignment",
      body: assignment_body_el,
      footer: assignment_footer_el,
    });

    body_el.querySelector("[name=transcription-assignment]").append(assignment_el);

    return body_el;
  }

  /**
   * Extend parent method
   */
  create_footer_element() {
    const footer_el = CN_element.create(`
      <div class="btn-group" role="group">
        <button name="back" type="button" class="btn btn-primary">View Application</button>
      </div>
    `);
    footer_el.querySelector("button[name=back]").addEventListener("click", this.on_navigate_to_parent.bind(this));
    return footer_el;
  }
}
