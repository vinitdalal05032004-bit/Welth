const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRealisticData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";

    const now = new Date();

    try {
        // 1. Update Budget to be realistic for INR
        await prisma.budget.upsert({
            where: { userId },
            update: { amount: 100000 },
            create: { userId, amount: 100000 }
        });
        console.log("Updated budget to ₹1,00,000");

        // 2. Clear all previous transactions to start fresh with realistic INR scale
        await prisma.transaction.deleteMany({ where: { userId } });
        console.log("Cleared old transactions.");

        const transactions = [];

        // --- WORK ACCOUNT (Realistic Business Data - INR) ---
        // Big Income Payments
        const workIncomes = [
            { amount: 120000, desc: "Project Milestone: E-commerce Site", cat: "Salary", daysAgo: 28 },
            { amount: 85000, desc: "Monthly Consulting Retainer", cat: "Salary", daysAgo: 15 },
            { amount: 45000, desc: "UI Design Phase 1 - Client B", cat: "Salary", daysAgo: 5 }
        ];

        workIncomes.forEach(inc => {
            const date = new Date();
            date.setDate(now.getDate() - inc.daysAgo);
            transactions.push({
                type: "INCOME", amount: inc.amount, description: inc.desc, category: inc.cat,
                date, accountId: workAccountId, status: "COMPLETED", userId
            });
        });

        // Work Expenses
        const workExpenses = [
            { amount: 15000, desc: "Facebook Ad Campaign", cat: "Marketing", daysAgo: 20 },
            { amount: 8000, desc: "Software Licenses (Adobe/JetBrains)", cat: "Software", daysAgo: 18 },
            { amount: 12500, desc: "Freelance Developer - API Integration", cat: "Professional Services", daysAgo: 10 },
            { amount: 3500, desc: "Co-working Space Membership", cat: "Office", daysAgo: 2 },
            { amount: 1200, desc: "Domain & Hosting Renewal", cat: "Software", daysAgo: 12 }
        ];

        workExpenses.forEach(exp => {
            const date = new Date();
            date.setDate(now.getDate() - exp.daysAgo);
            transactions.push({
                type: "EXPENSE", amount: exp.amount, description: exp.desc, category: exp.cat,
                date, accountId: workAccountId, status: "COMPLETED", userId
            });
        });


        // --- PERSONAL ACCOUNT (Realistic Lifestyle Data - INR) ---
        // Salary Input
        const personalIncomes = [
            { amount: 95000, desc: "Corporate Salary Credit", cat: "Income", daysAgo: 1 }
        ];

        personalIncomes.forEach(inc => {
            const date = new Date();
            date.setDate(now.getDate() - inc.daysAgo);
            transactions.push({
                type: "INCOME", amount: inc.amount, description: inc.desc, category: inc.cat,
                date, accountId: personalAccountId, status: "COMPLETED", userId
            });
        });

        // Recurring Fixed Expenses
        const personalFixed = [
            { amount: 35000, desc: "House Rent", cat: "Housing", daysAgo: 2, isRec: true },
            { amount: 4500, desc: "Electricity & Water Bill", cat: "Utilities", daysAgo: 5 },
            { amount: 999, desc: "Airtel Fiber Broadband", cat: "Utilities", daysAgo: 6 },
            { amount: 1499, desc: "Gym Membership (Cult.fit)", cat: "Health", daysAgo: 4 }
        ];

        personalFixed.forEach(exp => {
            const date = new Date();
            date.setDate(now.getDate() - exp.daysAgo);
            transactions.push({
                type: "EXPENSE", amount: exp.amount, description: exp.desc, category: exp.cat,
                date, accountId: personalAccountId, status: "COMPLETED", userId,
                isRecurring: exp.isRec || false,
                recurringInterval: exp.isRec ? "MONTHLY" : null
            });
        });

        // Variable Daily Expenses (40+ transactions)
        const categories = [
            { desc: "BigBasket/Blinkit Groceries", cat: "Food", range: [800, 3000] },
            { desc: "Swiggy/Zomato Delivery", cat: "Food", range: [350, 1200] },
            { desc: "Uber/Ola Ride", cat: "Transportation", range: [150, 600] },
            { desc: "PVR Cinemas", cat: "Entertainment", range: [600, 1500] },
            { desc: "Amazon Shopping", cat: "Shopping", range: [1200, 5000] },
            { desc: "Blue Tokai Coffee", cat: "Food", range: [250, 600] },
            { desc: "Medical/Pharmacy", cat: "Health", range: [200, 1200] }
        ];

        for (let i = 0; i < 45; i++) {
            const cat = categories[Math.floor(Math.random() * categories.length)];
            const date = new Date();
            date.setDate(now.getDate() - Math.floor(Math.random() * 45));

            transactions.push({
                type: "EXPENSE",
                amount: Math.floor(Math.random() * (cat.range[1] - cat.range[0]) + cat.range[0]),
                description: cat.desc,
                category: cat.cat,
                date,
                accountId: personalAccountId,
                status: "COMPLETED",
                userId
            });
        }

        // Insert everything
        const created = await prisma.transaction.createMany({ data: transactions });
        console.log(`Successfully added ${created.count} realistic INR-based transactions.`);

        // 3. Sync Balances for both accounts
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
            console.log(`Synced balance for ${account.name}: ₹${balance}`);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

fixRealisticData();
