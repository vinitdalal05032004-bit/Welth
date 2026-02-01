const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAccounts() {
    try {
        const accounts = await prisma.account.findMany({
            include: {
                _count: {
                    select: { transactions: true }
                }
            }
        });

        console.log(JSON.stringify(accounts.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            balance: a.balance,
            transactions: a._count.transactions,
            userId: a.userId
        })), null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

listAccounts();
