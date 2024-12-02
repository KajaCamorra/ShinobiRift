const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function setupDatabase() {
    // Connect as superuser first
    const superClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'shinobiAdmin32@POSTGRES'
    });

    try {
        console.log('Connecting as superuser...');
        await superClient.connect();

        // Create database if it doesn't exist
        const dbExists = await superClient.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            ['shinobi_rift_db']
        );

        if (dbExists.rows.length === 0) {
            console.log('Creating database...');
            await superClient.query('CREATE DATABASE shinobi_rift_db');
        }

        // Create user if doesn't exist
        const userExists = await superClient.query(
            "SELECT 1 FROM pg_roles WHERE rolname = $1",
            ['shinobi_strapi']
        );

        if (userExists.rows.length === 0) {
            console.log('Creating database user...');
            await superClient.query("CREATE USER shinobi_strapi WITH PASSWORD 'shinobiStrapi21@POSTGRES'");
        }

        // Grant privileges
        await superClient.query('ALTER DATABASE shinobi_rift_db OWNER TO shinobi_strapi');
        
        console.log('Database setup completed');
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    } finally {
        await superClient.end();
    }
}

async function runMigration() {
    // Connect as the application user
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'shinobi_rift_db',
        user: 'shinobi_strapi',
        password: 'shinobiStrapi21@POSTGRES',
        ssl: false
    });

    try {
        console.log('Connecting as application user...');
        await client.connect();
        console.log('Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, '../database/migrations/chat_system_init.sql');
        console.log('Reading migration file from:', migrationPath);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        console.log('Running migration...');
        await client.query(migrationSQL);
        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

async function main() {
    try {
        await setupDatabase();
        await runMigration();
        console.log('Database setup and migration completed successfully');
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

main();
