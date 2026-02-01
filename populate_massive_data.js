const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateMassiveRealisticData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";
    const workId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";
    const budgetTotal = 100000;

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    try {
        // 1. Reset
        await prisma.transaction.deleteMany({ where: { userId } });

        const transactions = [];

        // --- RECURRING DATA (Foundations) ---
        // Personal
        transactions.push({ type: "INCOME", amount: 150000, description: "Monthly Fixed Salary", category: "Income", date: new Date(now.getFullYear(), now.getMonth(), 1), accountId: personalId, isRecurring: true, recurringInterval: "MONTHLY", userId, status: "COMPLETED" });
        transactions.push({ type: "EXPENSE", amount: 25000, description: "House Rent", category: "Housing", date: new Date(now.getFullYear(), now.getMonth(), 1), accountId: personalId, isRecurring: true, recurringInterval: "MONTHLY", userId, status: "COMPLETED" });

        // Work
        transactions.push({ type: "INCOME", amount: 200000, description: "Main Client Retainer", category: "Salary", date: new Date(now.getFullYear(), now.getMonth(), 5), accountId: workId, isRecurring: true, recurringInterval: "MONTHLY", userId, status: "COMPLETED" });
        transactions.push({ type: "EXPENSE", amount: 15000, description: "Office Space Lease", category: "Office", date: new Date(now.getFullYear(), now.getMonth(), 5), accountId: workId, isRecurring: true, recurringInterval: "MONTHLY", userId, status: "COMPLETED" });

        // --- NON-RECURRING DATA (70+ Transactions) ---
        // We need: 
        // Personal Total Expenses: 93,000 (Already have 25,000 rent -> need 68,000 more)
        // Work Total Expenses: 60,000 (Already have 15,000 lease -> need 45,000 more)

        // Generate 45 Personal Transactions
        let personalRemaining = 68000;
        const personalVendors = [
            { d: "BigBasket", c: "Food" }, { d: "Zomato", c: "Food" }, { d: "Amazon", c: "Shopping" },
            { d: "Uber", c: "Transportation" }, { d: "Starbucks", c: "Food" }, { d: "Pharmacy", c: "Health" }
        ];

        for (let i = 0; i < 45; i++) {
            const isLast = i === 44;
            const amount = isLast ? personalRemaining : Math.floor(Math.random() * (personalRemaining / (45 - i)) * 1.5);
            personalRemaining -= amount;

            const v = personalVendors[Math.floor(Math.random() * personalVendors.length)];
            transactions.push({
                type: "EXPENSE", amount, description: v.d, category: v.c,
                date: new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())),
                accountId: personalId, userId, status: "COMPLETED"
            });
        }

        // Generate 25 Work Transactions
        let workRemaining = 45000;
        const workVendors = [
            { d: "Facebook Ads", c: "Marketing" }, { d: "GitHub", c: "Software" }, { d: "Contractor Payout", c: "Professional Services" },
            { d: "Vercel", c: "Software" }, { d: "Client Dinner", c: "Food" }, { d: "Stationary", c: "Office" }
        ];

        for (let i = 0; i < 25; i++) {
            const isLast = i === 24;
            const amount = isLast ? workRemaining : Math.floor(Math.random() * (workRemaining / (25 - i)) * 1.5);
            workRemaining -= amount;

            const v = workVendors[Math.floor(Math.random() * workVendors.length)];
            transactions.push({
                type: "EXPENSE", amount, description: v.d, category: v.c,
                date: new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime())),
                accountId: workId, userId, status: "COMPLETED"
            });
        }

        // --- FINAL INSERT & SYNC ---
        await prisma.transaction.createMany({ data: transactions });

        const accounts = await prisma.account.findMany({ where: { userId } });
        for (const account of accounts) {
            const totalIncome = await prisma.transaction.aggregate({ where: { accountId: account.id, type: "INCOME" }, _sum: { amount: true } });
            const totalExpense = await prisma.transaction.aggregate({ where: { accountId: account.id, type: "EXPENSE" }, _sum: { amount: true } });
            const balance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);
            await prisma.account.update({ where: { id: account.id }, data: { balance } });
            console.log(`Synced ${account.name}: ₹${balance}`);
        }

        console.log("\nTarget Reached:");
        console.log("- Personal: 93% (₹93,000 / ₹1,00,000)");
        console.log("- Work: 60% (₹60,000 / ₹1,00,000)");

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

populateMassiveRealisticData();
