const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkAll() {
    try {
        const users = await prisma.user.findMany({
            include: {
                accounts: true,
                budgets: true
            }
        });

        fs.writeFileSync('all_users_status.json', JSON.stringify(users, null, 2));
        console.log("Status written to all_users_status.json");

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();
