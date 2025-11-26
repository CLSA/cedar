const { CN_base_model } = await import(`${CENOZO_URL}/js/base_model.mjs`);

export class CN_test_type_model extends CN_base_model {
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
