const { CN_action_list } = await import(`${CENOZO_URL}/js/element/action/list.mjs`);
const classes = await import(`${CENOZO_URL}/js/model/language.mjs`);

const base_list_class = classes.CN_language_list ? classes.CN_language_list : CN_action_list;
export class CN_language_list extends base_list_class {
  /**
   * Extend parent method
   */
  async on_choose() {
    await super.on_choose();
    
    if (!this.is_choosing()) {
      // if the parent is a test entry then update it (so the data model's action is also updated)
      const parent_model = this.get_model().get_parent_model();
      console.log(parent_model, parent_model.get_name());
      if (parent_model && "test_entry" == parent_model.get_name()) {
        await parent_model.get_action().run();
      }
    }
  }
}
