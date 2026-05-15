const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_action_list } = await import(`${CENOZO_URL}/js/action/list.mjs`);
const { CN_action_view } = await import(`${CENOZO_URL}/js/action/view.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);
const { CN_modal_confirm } = await import(`${CENOZO_URL}/js/modal/confirm.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

export class CN_model_test_type extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "test type",
        plural: "test types",
        posessive: "test type's",
      },
      columns: {
        rank: { title: "Rank" },
        name: { title: "Name" },
        data_type: { title: "Data Type" },
        average_score: { title: "Average Score", table_prefix: false },
        average_alt_score: { title: "Average Alt Score", table_prefix: false },
      },
      properties: {
        rank: { title: "Rank" },
        name: { title: "Name", format: "identifier" },
        data_type: { title: "Data Type" },
        average_score: { meta: {}, title: "Average Score", is_constant: () => true },
        average_alt_score: { meta: {}, title: "Average Alternate Score", is_constant: () => true },
        description: { title: "Description", type: "text" },
      },
    });
  }
}

export class CN_list_test_type extends CN_action_list {
  /**
   * Extends the parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const btn_group_el = footer_el.querySelector("div.btn-group");

    if (2 < CN_session.get("role", "tier")) {
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
            async () => await CN_api.count("test_type", { rescore: 1 }),
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

export class CN_view_test_type extends CN_action_view {
  /**
   * Extends the parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();
    const btn_group_el = footer_el.querySelector("div[name=left-btn-group]");

    if (2 < CN_session.get("role", "tier")) {
      const rescore_btn_el = this.constructor.html(
        '<button name="rescore" type="button" class="btn btn-light btn-outline-primary">Rescore</button>'
      );
      rescore_btn_el.addEventListener("click", async () => {
        const name = this.get_property_value("name");
        const response = await CN_modal_confirm.create_and_open({
          title: "Rescore All Test Entries",
          message: `
            <div class="pb-2">Are you sure you wish to re-score all ${name} entries?</div>
            <div>
              This process is processor-intensive and may slow down the application for all
              users while scores are being re-calculated.  You should only continue if it is
              necessary for ${name} tests to be re-scored immediately.
            </div>
          `,
        });

        if (response) {
          this.constructor.set_disabled(rescore_btn_el, true);
          await this.constructor.wait_for(
            async () => await CN_api.count(this.get_model().get_view_url(null, "api"), { rescore: 1 }),
            0, // show wait-for message immediately
          );
          this.constructor.set_disabled(rescore_btn_el, false);
          this.get_model().get_child_model_list()
            .filter(child_model => "test_entry" == child_model.get_name())
            .forEach(child_model => child_model.run());
        }
      });
      btn_group_el.append(rescore_btn_el);
    }

    return footer_el;
  }
}
