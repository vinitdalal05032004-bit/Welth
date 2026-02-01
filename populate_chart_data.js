const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";

    try {
        // 1. Clear existing transactions for these accounts to start fresh
        await prisma.transaction.deleteMany({
            where: {
                accountId: { in: [personalAccountId, workAccountId] },
                isRecurring: false // Keep the recurring ones we just set up
            }
        });

        const transactions = [];
        const now = new Date();

        // Generate daily data for the last 30 days (Jan 2 - Feb 1)
        for (let i = 1; i <= 30; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            // Random Expenses (Daily)
            // Most days have 1-2 small expenses
            const numExpenses = Math.floor(Math.random() * 3);
            for (let j = 0; j < numExpenses; j++) {
                const amount = Math.floor(Math.random() * 500) + 50;
                transactions.push({
                    type: "EXPENSE",
                    amount: amount,
                    description: ["Lunch", "Uber", "Coffee", "Groceries", "Snacks", "Pharmacy"][Math.floor(Math.random() * 6)],
                    date: date,
                    category: ["Food", "Transportation", "Shopping", "Health"][Math.floor(Math.random() * 4)],
                    userId,
                    accountId: personalAccountId,
                    status: "COMPLETED"
                });
            }

            // Larger Weekly Expenses (Rent, Utilities, etc.)
            if (i % 7 === 0) {
                transactions.push({
                    type: "EXPENSE",
                    amount: Math.floor(Math.random() * 2000) + 1000,
                    description: "Weekly Utilities/Rent",
                    date: date,
                    category: "Housing",
                    userId,
                    accountId: personalAccountId,
                    status: "COMPLETED"
                });
            }
        }

        // Add 6-7 Large Income Spikes (Green Bars in Chart)
        // Total should be around $57,000
        const incomeSpikes = [
            { amount: 15000, desc: "Primary Salary", cat: "Salary", acc: workAccountId },
            { amount: 12000, desc: "Project Milestone", cat: "Salary", acc: workAccountId },
            { amount: 8500, desc: "Stock Divident", cat: "Investment", acc: personalAccountId },
            { amount: 10500, desc: "Consulting Fee", cat: "Salary", acc: workAccountId },
            { amount: 6000, desc: "Tax Refund", cat: "Investment", acc: personalAccountId },
            { amount: 5378, desc: "Bonus", cat: "Salary", acc: workAccountId }
        ];

        incomeSpikes.forEach((spike, index) => {
            const date = new Date();
            date.setDate(now.getDate() - (index * 4 + 2)); // Spread them out
            transactions.push({
                type: "INCOME",
                amount: spike.amount,
                description: spike.desc,
                date: date,
                category: spike.cat,
                userId,
                accountId: spike.acc,
                status: "COMPLETED"
            });
        });

        // Create all transactions
        const created = await prisma.transaction.createMany({
            data: transactions
        });

        console.log(`Created ${created.count} transactions to match chart patterns.`);

        // Sync balances
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
            console.log(`Synced balance for ${account.name}: ${balance}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

populateData();
