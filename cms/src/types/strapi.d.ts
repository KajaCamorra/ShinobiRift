declare module '@strapi/strapi' {
    interface Common {
        uid: string;
    }

    interface StrapiService extends Common {
        initialize(params: any): void;
    }

    interface StrapiController extends Common {
        find(ctx: any): Promise<any>;
        findOne(ctx: any): Promise<any>;
        create(ctx: any): Promise<any>;
        update(ctx: any): Promise<any>;
        delete(ctx: any): Promise<any>;
    }

    interface StrapiRoute extends Common {
        method: string;
        path: string;
        handler: string;
        config?: {
            policies?: string[];
            auth?: boolean;
        };
    }

    interface StrapiPlugin {
        bootstrap(params: { strapi: Strapi }): Promise<void> | void;
        register(params: { strapi: Strapi }): Promise<void> | void;
        destroy(params: { strapi: Strapi }): Promise<void> | void;
    }

    interface Strapi {
        server: any;
        service(uid: string): any;
        controller(uid: string): any;
        plugin(name: string): any;
        config: any;
        admin: any;
        entityService: any;
    }
}
