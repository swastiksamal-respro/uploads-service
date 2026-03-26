// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    }
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.TST_DB_HOST,
      user: process.env.TST_DB_USER,
      password: process.env.TST_DB_PASSWORD,
      database: process.env.TST_DB_NAME
    }
  },

};

