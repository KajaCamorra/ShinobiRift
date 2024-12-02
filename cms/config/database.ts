export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'shinobi_rift_db'),
      user: env('DATABASE_USERNAME', 'shinobi_strapi'),
      password: String(env('DATABASE_PASSWORD', 'shinobiStrapi21@POSTGRES')),
      ssl: env.bool('DATABASE_SSL', false),
    },
    debug: false,
  },
});
