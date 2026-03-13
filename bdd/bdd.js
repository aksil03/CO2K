import sqlite3 from 'sqlite3';
const db = new sqlite3.Database('./bdd/database.sqlite');

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS utilisateurs`);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS utilisateurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT,
      prenom TEXT,
      email TEXT UNIQUE,
      password TEXT
    )
  `, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("table crée");
    }
  });
});

db.close();