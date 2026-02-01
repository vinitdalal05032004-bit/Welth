const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addRealisticPersonalData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";

    const now = new Date();
    const rawTransactions = [];

    // --- RECURRING LOGIC ---
    [1, 32].forEach(daysAgo => {
        const date = new Date();
        date.setDate(now.getDate() - daysAgo);
        rawTransactions.push({
            type: "EXPENSE", amount: 1500, description: "Apartment Rent", category: "Housing",
            date, isRecurring: true, recurringInterval: "MONTHLY"
        });
    });

    [15, 30, 45].forEach(daysAgo => {
        const date = new Date();
        date.setDate(now.getDate() - daysAgo);
        rawTransactions.push({
            type: "INCOME", amount: 4500, description: "Salary Deposit", category: "Income",
            date, isRecurring: true, recurringInterval: "MONTHLY"
        });
    });

    [10, 40].forEach(daysAgo => {
        const date = new Date();
        date.setDate(now.getDate() - daysAgo);
        rawTransactions.push({ type: "EXPENSE", amount: 120, description: "Internet Bill", category: "Utilities", date });
        rawTransactions.push({ type: "EXPENSE", amount: 85, description: "Electricity Bill", category: "Utilities", date });
    });

    const subs = [
        { name: "Spotify Premium", amount: 12, cat: "Entertainment" },
        { name: "iCloud Storage", amount: 2.99, cat: "Software" },
        { name: "Gym Membership", amount: 50, cat: "Health" }
    ];
    [5, 35].forEach(daysAgo => {
        const date = new Date();
        date.setDate(now.getDate() - daysAgo);
        subs.forEach(s => {
            rawTransactions.push({ type: "EXPENSE", amount: s.amount, description: s.name, category: s.cat, date });
        });
    });

    const groceryStores = ["Whole Foods", "Trader Joe's", "Safeway", "Local Market"];
    const diningSpots = ["Starbucks", "Chipotle", "Local Bistro", "Pizza Hut", "Sushi Bar"];
    const transport = ["Uber", "Lyft", "Shell Gas Station", "Transit Pass"];
    const lifestyle = ["Amazon Purchase", "Movie Tickets", "Pharmacy", "Pet Supplies", "Uniqlo"];

    for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(now.getDate() - Math.floor(Math.random() * 45));

        const rand = Math.random();
        if (rand < 0.3) {
            rawTransactions.push({ type: "EXPENSE", amount: (Math.random() * 80 + 20).toFixed(2), description: groceryStores[Math.floor(Math.random() * groceryStores.length)], category: "Food", date });
        } else if (rand < 0.6) {
            rawTransactions.push({ type: "EXPENSE", amount: (Math.random() * 60 + 10).toFixed(2), description: diningSpots[Math.floor(Math.random() * diningSpots.length)], category: "Food", date });
        } else if (rand < 0.8) {
            rawTransactions.push({ type: "EXPENSE", amount: (Math.random() * 40 + 5).toFixed(2), description: transport[Math.floor(Math.random() * transport.length)], category: "Transportation", date });
        } else {
            rawTransactions.push({ type: "EXPENSE", amount: (Math.random() * 150 + 10).toFixed(2), description: lifestyle[Math.floor(Math.random() * lifestyle.length)], category: "Shopping", date });
        }
    }

    try {
        const data = rawTransactions.map(t => ({
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description,
            category: t.category,
            date: t.date,
            isRecurring: t.isRecurring || false,
            recurringInterval: t.recurringInterval || null,
            status: "COMPLETED",
            userId: userId,
            accountId: personalAccountId
        }));

        await prisma.transaction.deleteMany({ where: { accountId: personalAccountId } });

        const created = await prisma.transaction.createMany({ data });
        console.log(`Successfully added ${created.count} realistic transactions to Personal account.`);

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
        console.error("Error details:", JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

addRealisticPersonalData();
