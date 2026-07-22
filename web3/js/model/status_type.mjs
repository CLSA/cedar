const { CN_api } = await import(`${CENOZO_URL}/js/api.mjs`);
const { CN_base_model } = await import(`${CENOZO_URL}/js/model/base_model.mjs`);

export class CN_model_status_type extends CN_base_model {
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
        category: {
          title: "Category",
          type: "enum",
          is_constant: () => "view" == this.get_action_name(),
          on_change: async (form_input, valid) => {
            const action = form_input.get_action();

            // run the default behaviour
            await action.on_property_change("category", valid);

            // then update the element to propagate the changed property
            if (valid) action.update_element();
          },
        },
        rank: {
          title: "Rank",
          type: "rank",
          max_rank: async (form_input) => {
            const action = form_input.get_action();

            // the max rank depends on which category has been selected
            let max_rank = 0;
            const category = action.get_property_value("category");
            if (category) {
              const response = await CN_api.get(action.get_model().get_base_path("api"), {
                select: { column: {
                  column: "max(status_type.rank)",
                  alias: "max_rank",
                  table_prefix: false
                } },
                modifier: { where: {
                  column: "status_type.category",
                  operator: "=",
                  value: category,
                } },
              });

              max_rank = Number(null == response[0].max_rank ? 0 : response[0].max_rank);
            }

            // if this is the add action then add an additional rank
            return max_rank + ("add" == action.get_type() ? 1 : 0);
          },
        },
        name: { title: "Name", format: "identifier" },
      },
    });
  }
}
