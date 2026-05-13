const { CN_model_base } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_model_filename_format extends CN_model_base {
  constructor() {
    super({
      wording: {
        singular: "filename format",
        plural: "filename formats",
        posessive: "filename format's",
      },
      columns: {
        format: { title: "Format" },
      },
      properties: {
        format: {
          title: "Format",
          help: "A regular expression used to match recording filenames to the parent test type.",
        },
      },
    });
  }
}
