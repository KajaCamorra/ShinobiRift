/**
 * effect-type router
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/effect-types',
      handler: 'effect-type.find',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/effect-types/:id',
      handler: 'effect-type.findOne',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/effect-types',
      handler: 'effect-type.create',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/effect-types/:id',
      handler: 'effect-type.update',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/effect-types/:id',
      handler: 'effect-type.delete',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
