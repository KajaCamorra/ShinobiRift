/**
 * effect-type controller
 */

export default {
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.service('api::effect-type.effect-type').findOne(id);
    return entity;
  },

  async create(ctx) {
    const { data } = await super.create(ctx);
    return { data };
  },

  async update(ctx) {
    const { id } = ctx.params;
    const { data } = await super.update(ctx);
    return { data };
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const { data } = await super.delete(ctx);
    return { data };
  }
};
