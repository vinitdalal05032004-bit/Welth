const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBalances() {
    try {
        const accounts = await prisma.account.findMany();

        for (const account of accounts) {
            const totalIncome = await prisma.transaction.aggregate({
                where: { accountId: account.id, type: "INCOME" },
                _sum: { amount: true }
            });

            const totalExpense = await prisma.transaction.aggregate({
                where: { accountId: account.id, type: "EXPENSE" },
                _sum: { amount: true }
            });

            const balance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);

            await prisma.account.update({
                where: { id: account.id },
                data: { balance }
            });

            console.log(`Updated ${account.name} account balance to: ${balance}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

updateBalances();
