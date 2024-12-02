const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
    const client = new Client({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        ssl: process.env.DATABASE_SSL === 'true'
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Check schemas
        const schemas = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name IN ('communication', 'moderation');
        `);
        console.log('\nSchemas:');
        schemas.rows.forEach(schema => console.log(`- ${schema.schema_name}`));

        // Check tables in communication schema
        const commTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'communication';
        `);
        console.log('\nCommunication Tables:');
        commTables.rows.forEach(table => console.log(`- ${table.table_name}`));

        // Check tables in moderation schema
        const modTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'moderation';
        `);
        console.log('\nModeration Tables:');
        modTables.rows.forEach(table => console.log(`- ${table.table_name}`));

        // Check if triggers are created
        const triggers = await client.query(`
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers
            WHERE trigger_schema IN ('communication', 'moderation');
        `);
        console.log('\nTriggers:');
        triggers.rows.forEach(trigger => 
            console.log(`- ${trigger.trigger_name} on ${trigger.event_object_table}`)
        );

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await client.end();
    }
}

checkTables();
