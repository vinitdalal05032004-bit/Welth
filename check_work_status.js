const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const workAccount = await prisma.account.findFirst({
            where: { name: { contains: "Work", mode: 'insensitive' } }
        });

        if (!workAccount) {
            console.log("No Work account found");
            return;
        }

        const userId = workAccount.userId;
        const budget = await prisma.budget.findUnique({
            where: { userId }
        });

        const totalExpenses = await prisma.transaction.aggregate({
            where: {
                userId,
                type: "EXPENSE"
            },
            _sum: { amount: true }
        });

        const result = {
            workAccount,
            userId,
            budget,
            totalExpenses: totalExpenses._sum.amount || 0
        };

        fs.writeFileSync('work_status.json', JSON.stringify(result, null, 2));
        console.log("Status written to work_status.json");

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
