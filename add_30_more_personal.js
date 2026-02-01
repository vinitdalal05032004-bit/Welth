const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMorePersonalData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";

    const now = new Date();
    const rawTransactions = [];

    // --- High Value Transactions (Vacation/Luxury) ---
    rawTransactions.push({ type: "EXPENSE", amount: 1200, description: "Weekend Getaway Hotel", category: "Travel", date: new Date(now.setDate(now.getDate() - 5)) });
    rawTransactions.push({ type: "EXPENSE", amount: 450, description: "Dinner at Michelin Star Restaurant", category: "Food", date: new Date(now.setDate(now.getDate() - 1)) });
    rawTransactions.push({ type: "EXPENSE", amount: 899, description: "New Smartphone Upgrade", category: "Shopping", date: new Date(now.setDate(now.getDate() - 12)) });

    // --- Random Daily Transactions (30 more) ---
    const vendors = [
        { desc: "Starbucks Coffee", cat: "Food", min: 5, max: 15 },
        { desc: "Uber Trip", cat: "Transportation", min: 12, max: 35 },
        { desc: "Steam Games", cat: "Entertainment", min: 20, max: 60 },
        { desc: "Weekly Groceries", cat: "Food", min: 60, max: 140 },
        { desc: "Amazon Essentials", cat: "Shopping", min: 15, max: 80 },
        { desc: "Local Pharmacy", cat: "Health", min: 10, max: 45 },
        { desc: "Netflix Subscription", cat: "Entertainment", min: 15, max: 15 },
        { desc: "Cinema Tickets", cat: "Entertainment", min: 25, max: 40 },
        { desc: "Gas Station", cat: "Transportation", min: 40, max: 65 },
        { desc: "Weekend Brunch", cat: "Food", min: 35, max: 70 }
    ];

    for (let i = 0; i < 30; i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 45)); // Spread over 45 days

        rawTransactions.push({
            type: "EXPENSE",
            amount: (Math.random() * (vendor.max - vendor.min) + vendor.min).toFixed(2),
            description: vendor.desc,
            category: vendor.cat,
            date: date
        });
    }

    try {
        const data = rawTransactions.map(t => ({
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description,
            category: t.category,
            date: t.date,
            isRecurring: false,
            status: "COMPLETED",
            userId: userId,
            accountId: personalAccountId
        }));

        const created = await prisma.transaction.createMany({ data });
        console.log(`Successfully added ${created.count} additional transactions to Personal account.`);

        // Sync balance
        const totalIncome = await prisma.transaction.aggregate({
            where: { accountId: personalAccountId, type: "INCOME" },
            _sum: { amount: true }
        });
        const totalExpense = await prisma.transaction.aggregate({
            where: { accountId: personalAccountId, type: "EXPENSE" },
            _sum: { amount: true }
        });
        const balance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);

        await prisma.account.update({
            where: { id: personalAccountId },
            data: { balance }
        });
        console.log(`Synced balance for Personal: $${balance.toFixed(2)}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

addMorePersonalData();
