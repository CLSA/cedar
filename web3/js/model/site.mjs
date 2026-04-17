const { CN_action_view } = await import(`${CENOZO_URL}/js/action/view.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);

const classes = await import(`${CENOZO_URL}/js/model/site.mjs`);
const base_view_class = classes.CN_site_view ? classes.CN_site_view : CN_action_view;

export class CN_site_view extends base_view_class {
  /**
   * Extends the parent method
   */
  create_footer_element() {
    const footer_el = super.create_footer_element();

    const settings_btn_el = this.constructor.html(
      '<button name="settings" class="btn btn-light btn-outline-primary">Settings</button>'
    );
    settings_btn_el.addEventListener("click", async () => {
      const model = this.get_model();
      await CN_session.navigate_to(`${model.get_view_url()}/setting/view/site_id=${model.get_identifier()}`);
    });
    footer_el.querySelector("div.btn-group").append(settings_btn_el);

    return footer_el;
  }
}
