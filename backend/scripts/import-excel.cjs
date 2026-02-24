process.env.SEED_MODE = 'import';
require('ts-node/register/transpile-only');
require('../prisma/seed.ts');
