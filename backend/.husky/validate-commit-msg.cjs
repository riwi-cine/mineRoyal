#!/usr/bin/env node
/**
 * Validates the commit message format: [US-XXX] tipo: descripción
 * Allowed types: feat, fix, test, refactor, docs, chore
 */
const fs = require('fs');

const messageFile = process.argv[2];
const message = fs.readFileSync(messageFile, 'utf8').split('\n')[0].trim();

const pattern = /^\[US-\d+\] (feat|fix|test|refactor|docs|chore): .+$/;

if (!pattern.test(message)) {
  console.error('\nCommit rechazado: el mensaje no cumple la convención requerida.\n');
  console.error('Formato esperado: [US-XXX] tipo: descripción');
  console.error('Tipos permitidos: feat, fix, test, refactor, docs, chore\n');
  console.error('Ejemplo válido:   [US-101] feat: agregar autenticación de usuarios');
  console.error(`Mensaje recibido: "${message}"\n`);
  process.exit(1);
}

process.exit(0);
