const { CN_base_element } = await import(`${CENOZO_URL}/js/element/base_element.mjs`);
const { CN_session } = await import(`${CENOZO_URL}/js/session.mjs`);
const classes = await import(`${CENOZO_URL}/js/model/home.mjs`);

export class CN_model_home extends classes.CN_model_home {
  #transcription_model;

  /**
   * Extend parent method
   */
  update_element() {
    super.update_element();
    if ("typist" == CN_session.get("role", "name") && this.#transcription_model) {
      this.get_element().querySelector("div[name=transcription-list]").replaceChildren(
        this.#transcription_model.get_element()
      );
    }
  }

  /**
   * Extend parent method
   */
  _create_element() {
    const el = super._create_element();
    if ("typist" == CN_session.get("role", "name")) {
      el.querySelector("div.row").append(CN_base_element.html(
        '<div name="transcription-list" class="mt-4"></div>'
      ));
    }
    return el;
  }

  /**
   * Extend parent method
   */
  async run() {
    if ("typist" == CN_session.get("role", "name")) {
      const transcription_module = CN_session.get_module("transcription");
      await transcription_module.load_classes();
      this.#transcription_model = transcription_module.create_model();
      this.#transcription_model.configure(this.get_element().querySelector("div.row"), "list");
      await this.#transcription_model.run();
    }

    await super.run();
  }
}
