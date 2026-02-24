process.env.SEED_MODE = 'bootstrap';
require('ts-node/register/transpile-only');
require('../prisma/seed.ts');
