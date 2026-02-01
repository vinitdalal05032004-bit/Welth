const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBudget() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found");
            return;
        }
        console.log(`Checking for User: ${user.name} (${user.id})`);

        const account = await prisma.account.findFirst({
            where: { userId: user.id }
        });
        console.log(`Account ID: ${account?.id}`);

        const budget = await prisma.budget.findFirst({
            where: { userId: user.id },
        });
        console.log(`Budget: ${budget?.amount}`);

        // DEBUGGING DATE LOGIC from actions/budget.js
        const currentDate = new Date();
        const startOfPeriod = new Date();
        startOfPeriod.setDate(currentDate.getDate() - 30);

        console.log(`\nQuery Range:`);
        console.log(`Start: ${startOfPeriod.toISOString()}`);
        console.log(`End:   ${currentDate.toISOString()}`);

        const expenses = await prisma.transaction.aggregate({
            where: {
                userId: user.id,
                type: "EXPENSE",
                date: {
                    gte: startOfPeriod,
                    lte: currentDate,
                },
                accountId: account.id,
            },
            _sum: {
                amount: true,
            },
        });

        console.log(`\nCalculated Expenses: ${expenses._sum.amount}`);

        // Inspect recent transactions dates
        const recentTx = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                type: "EXPENSE",
                accountId: account.id
            },
            orderBy: { date: 'desc' },
            take: 5,
            select: { date: true, amount: true }
        });
        console.log("\nRecent Transaction Dates in DB:");
        recentTx.forEach(t => console.log(`${t.date.toISOString()} - ${t.amount}`));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

debugBudget();
