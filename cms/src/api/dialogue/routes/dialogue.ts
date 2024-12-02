/**
 * dialogue router
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/dialogues',
      handler: 'dialogue.find',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/dialogues/:id',
      handler: 'dialogue.findOne',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/dialogues',
      handler: 'dialogue.create',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/dialogues/:id',
      handler: 'dialogue.update',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/dialogues/:id',
      handler: 'dialogue.delete',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
};
