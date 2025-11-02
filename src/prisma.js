
const { PrismaClient } = require('@prisma/client');

let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Avoid hot-reload multiple clients in dev
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = { prisma };
