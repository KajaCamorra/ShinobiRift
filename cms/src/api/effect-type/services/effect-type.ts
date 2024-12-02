/**
 * effect-type service
 */

export default {
  async find(params) {
    return await strapi.entityService.findMany('api::effect-type.effect-type', params);
  },

  async findOne(id, params = {}) {
    return await strapi.entityService.findOne('api::effect-type.effect-type', id, params);
  },

  async create(data) {
    return await strapi.entityService.create('api::effect-type.effect-type', { data });
  },

  async update(id, data) {
    return await strapi.entityService.update('api::effect-type.effect-type', id, { data });
  },

  async delete(id) {
    return await strapi.entityService.delete('api::effect-type.effect-type', id);
  }
};
