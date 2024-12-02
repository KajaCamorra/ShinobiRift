/**
 * dialogue service
 */

export default {
  async find(params) {
    return await strapi.entityService.findMany('api::dialogue.dialogue', params);
  },

  async findOne(id, params = {}) {
    return await strapi.entityService.findOne('api::dialogue.dialogue', id, params);
  },

  async create(data) {
    return await strapi.entityService.create('api::dialogue.dialogue', { data });
  },

  async update(id, data) {
    return await strapi.entityService.update('api::dialogue.dialogue', id, { data });
  },

  async delete(id) {
    return await strapi.entityService.delete('api::dialogue.dialogue', id);
  }
};
