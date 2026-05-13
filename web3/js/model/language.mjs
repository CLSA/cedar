const { CN_action_list } = await import(`${CENOZO_URL}/js/action/list.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

const classes = await import(`${CENOZO_URL}/js/model/language.mjs`);
const base_list_class = classes.CN_list_language ? classes.CN_list_language : CN_action_list;

export class CN_model_language extends classes.CN_model_language {
  /**
   * Extend parent method
   */
  allow_choose() {
    const parent_model = this.get_parent_model();

    return (
      super.allow_choose() && !(
        parent_model &&
        "test_entry" == parent_model.get_name() &&
        "submitted" == parent_model.get_action().get_property_value("state")
      )
    );
  }

  /**
   * Extend parent method
   */
  allow_view() {
    return super.allow_view && 3 <= CN_session.get("role", "tier");
  }
}


export class CN_list_language extends base_list_class {
  /**
   * Extend parent method
   */
  async on_choose() {
    await super.on_choose();

    if (!this.is_choosing()) {
      // if the parent is a test entry then update it (so the data model's action is also updated)
      const parent_model = this.get_model().get_parent_model();
      if (parent_model && "test_entry" == parent_model.get_name()) {
        await parent_model.get_action().run();
      }
    }
  }
}
