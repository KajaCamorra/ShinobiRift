import { Strapi } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: Strapi }) {
    // Register any plugins or services that need to be available before bootstrap
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  bootstrap({ strapi }: { strapi: Strapi }) {
    // Initialize chat service after the HTTP server is ready
    strapi.server.httpServer?.on('listening', () => {
      try {
        const chatService = strapi.service('api::chat.chat');
        if (chatService && typeof chatService.initialize === 'function') {
          chatService.initialize();
          console.log('Chat service initialized successfully');
        } else {
          console.error('Chat service not found or initialize method not available');
        }
      } catch (error) {
        console.error('Failed to initialize chat service:', error);
      }
    });
  },
};
