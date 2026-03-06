const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_status_type_model extends CN_base_model {
  constructor() {
    super({
      wording: {
        singular: "status type",
        plural: "status types",
        posessive: "status type's",
      },
      columns: {
        category: { title: "Category" },
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name" },
      },
      properties: {
        category: { title: "Category", type: "enum", is_constant: () => true },
        rank: { title: "Rank", type: "rank" },
        name: { title: "Name", format: "identifier" },
      },
    });
  }
}
