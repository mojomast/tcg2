// scripts/verify-db.ts
import { db, initializeDatabase, closeDatabase } from '../src/db/database';

function verifyDatabaseSchema() {
  console.log('Running database verification script...');

  // Ensure database is initialized (though it initializes on import of database.ts)
  // Calling it again here is safe due to 'IF NOT EXISTS' in table creation.
  try {
    initializeDatabase();
    console.log('Database initialization function called successfully.');
  } catch (error) {
    console.error('Error calling initializeDatabase:', error);
    closeDatabase();
    process.exit(1);
  }

  try {
    // Query to list all tables in the database
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").all();
    
    console.log('\nTables found in the database:');
    if (tables.length > 0) {
      tables.forEach((table: any) => {
        console.log(`- ${table.name}`);
      });
    } else {
      console.log('No user tables found. This might indicate an issue with schema initialization.');
    }

    // Optionally, check for specific tables
    const expectedTables = ['cards', 'decks', 'deck_cards'];
    let allExpectedTablesFound = true;
    console.log('\nChecking for expected tables:');
    expectedTables.forEach(tableName => {
      const found = tables.some((t: any) => t.name === tableName);
      console.log(`- ${tableName}: ${found ? 'Found' : 'NOT FOUND'}`);
      if (!found) {
        allExpectedTablesFound = false;
      }
    });

    if (allExpectedTablesFound) {
      console.log('\nDatabase schema verification successful: All expected tables are present.');
    } else {
      console.error('\nDatabase schema verification FAILED: Not all expected tables were found.');
    }

  } catch (error) {
    console.error('Error querying database for tables:', error);
  } finally {
    closeDatabase();
  }
}

verifyDatabaseSchema();
