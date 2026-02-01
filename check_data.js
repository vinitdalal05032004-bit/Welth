const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found");
            return;
        }

        const budget = await prisma.budget.findUnique({
            where: { userId: user.id }
        });

        const account = await prisma.account.findFirst({
            where: { userId: user.id }
        });

        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            take: 10
        });

        const totalExpense = await prisma.transaction.aggregate({
            where: {
                userId: user.id,
                type: "EXPENSE"
            },
            _sum: {
                amount: true
            }
        });

        console.log(`User: ${user.name}`);
        console.log(`Budget: ₹${budget?.amount}`);
        console.log(`Total Expense: ₹${totalExpense._sum.amount}`);
        console.log(`Budget Used: ${((totalExpense._sum.amount / budget.amount) * 100).toFixed(1)}%`);
        console.log("\nRecent Transactions:");
        console.table(transactions.map(t => ({
            Date: t.date.toISOString().split('T')[0],
            Type: t.type,
            Category: t.category,
            Amount: `₹${t.amount}`,
            Description: t.description
        })));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
