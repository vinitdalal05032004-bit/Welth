const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setPreciseBudgets() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";
    const budgetAmount = 100000;

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    try {
        // 1. Ensure Budget is 1,00,000
        await prisma.budget.upsert({
            where: { userId },
            update: { amount: budgetAmount },
            create: { userId, amount: budgetAmount }
        });

        // 2. Clear all transactions for these accounts in the last 30 days
        await prisma.transaction.deleteMany({
            where: {
                userId,
                accountId: { in: [personalAccountId, workAccountId] },
                date: { gte: thirtyDaysAgo }
            }
        });

        const transactions = [];

        // --- PERSONAL ACCOUNT (93% Spending = 93,000) ---
        // Positive Balance: Income of 1,20,000
        transactions.push({
            type: "INCOME", amount: 150000, description: "Monthly Professional Payout", category: "Income",
            date: new Date(new Date().setDate(now.getDate() - 25)), accountId: personalAccountId, status: "COMPLETED", userId
        });

        // Expenses totaling 93,000
        transactions.push({ type: "EXPENSE", amount: 40000, description: "Luxurious Apartment Rent", category: "Housing", date: new Date(new Date().setDate(now.getDate() - 5)), accountId: personalAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 20000, description: "Premium Tech Gadget Purchase", category: "Shopping", date: new Date(new Date().setDate(now.getDate() - 10)), accountId: personalAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 15000, description: "Vacation Advance Booking", category: "Travel", date: new Date(new Date().setDate(now.getDate() - 15)), accountId: personalAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 10000, description: "Fine Dining & Events", category: "Food", date: new Date(new Date().setDate(now.getDate() - 2)), accountId: personalAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 8000, description: "Miscellaneous Lifestyle", category: "Shopping", date: new Date(new Date().setDate(now.getDate() - 20)), accountId: personalAccountId, status: "COMPLETED", userId });

        // --- WORK ACCOUNT (60% Spending = 60,000) ---
        // Positive Balance: Income of 2,50,000
        transactions.push({
            type: "INCOME", amount: 250000, description: "Q1 Project Full Payment", category: "Salary",
            date: new Date(new Date().setDate(now.getDate() - 28)), accountId: workAccountId, status: "COMPLETED", userId
        });

        // Expenses totaling 60,000
        transactions.push({ type: "EXPENSE", amount: 30000, description: "Office Space Monthly Rent", category: "Office", date: new Date(new Date().setDate(now.getDate() - 4)), accountId: workAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 15000, description: "Marketing & Lead Gen", category: "Marketing", date: new Date(new Date().setDate(now.getDate() - 12)), accountId: workAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 10000, description: "Contractor Payout", category: "Professional Services", date: new Date(new Date().setDate(now.getDate() - 18)), accountId: workAccountId, status: "COMPLETED", userId });
        transactions.push({ type: "EXPENSE", amount: 5000, description: "Software & Subscriptions", category: "Software", date: new Date(new Date().setDate(now.getDate() - 22)), accountId: workAccountId, status: "COMPLETED", userId });


        // Insert all
        await prisma.transaction.createMany({ data: transactions });

        // Sync Balances
        const accounts = await prisma.account.findMany({ where: { userId } });
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
            console.log(`Synced balance for ${account.name}: ₹${balance}`);
        }

        console.log("Budget Progress:");
        console.log("- Personal: 93,000 / 100,000 (93%)");
        console.log("- Work: 60,000 / 100,000 (60%)");

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

setPreciseBudgets();
