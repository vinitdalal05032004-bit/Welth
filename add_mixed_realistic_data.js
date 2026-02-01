const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMoreRealisticMixedData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";

    const now = new Date();
    const transactions = [];

    // --- RECURRING MIX (Work & Personal) ---
    // Work: Monthly SaaS Subscription (Inngest/Arcjet style)
    transactions.push({
        type: "EXPENSE", amount: 4500, description: "Monthly Cloud Infrastructure (AWS)", category: "Software",
        date: new Date(new Date().setDate(now.getDate() - 15)), accountId: workAccountId, status: "COMPLETED", userId,
        isRecurring: true, recurringInterval: "MONTHLY"
    });

    // Personal: Monthly SIP Investment
    transactions.push({
        type: "EXPENSE", amount: 15000, description: "Monthly Mutual Fund SIP", category: "Shopping", // Using Shopping as a proxy for Investments if not defined
        date: new Date(new Date().setDate(now.getDate() - 5)), accountId: personalAccountId, status: "COMPLETED", userId,
        isRecurring: true, recurringInterval: "MONTHLY"
    });

    // Work: Recurring Retainer Income from Small Client
    transactions.push({
        type: "INCOME", amount: 25000, description: "Monthly Maintenance: Client D", category: "Salary",
        date: new Date(new Date().setDate(now.getDate() - 20)), accountId: workAccountId, status: "COMPLETED", userId,
        isRecurring: true, recurringInterval: "MONTHLY"
    });

    // --- NON-RECURRING MIX (40+ Transactions) ---

    // 1. Professional/Business One-offs (Work)
    const workOneOffs = [
        { amount: 5000, desc: "Premium Font License for Project", cat: "Software" },
        { amount: 2500, desc: "Team Pizza Night", cat: "Food" },
        { amount: 1800, desc: "Courier Charges (Client Hard-drive)", cat: "Office" },
        { amount: 12000, desc: "L&D: React Advanced Workshop", cat: "Software" },
        { amount: 35000, desc: "New 27-inch Monitor", cat: "Office" }
    ];

    // 2. Personal Lifestyle One-offs (Personal)
    const personalOneOffs = [
        { amount: 8000, desc: "Zara Weekend Sale", cat: "Shopping" },
        { amount: 1200, desc: "Pharmacy: Vitamins & Supplements", cat: "Health" },
        { amount: 4500, desc: "Wine Tasting Event", cat: "Entertainment" },
        { amount: 3200, desc: "Nike Running Shoes", cat: "Shopping" },
        { amount: 600, desc: "Local Florist - Gift", cat: "Shopping" },
        { amount: 2200, desc: "Car Wash & Deep Clean", cat: "Transportation" }
    ];

    // Generate 45 total mixed transactions
    for (let i = 0; i < 45; i++) {
        const isWork = Math.random() > 0.6; // 40% Work, 60% Personal
        const pool = isWork ? workOneOffs : personalOneOffs;
        const template = pool[Math.floor(Math.random() * pool.length)];

        const date = new Date();
        date.setDate(now.getDate() - Math.floor(Math.random() * 60)); // Spread over 2 months

        transactions.push({
            type: "EXPENSE",
            amount: Math.floor(template.amount * (0.8 + Math.random() * 0.4)), // Variance
            description: template.desc,
            category: template.cat,
            date,
            accountId: isWork ? workAccountId : personalAccountId,
            status: "COMPLETED",
            userId
        });
    }

    // Add a few surprising Income one-offs
    transactions.push({
        type: "INCOME", amount: 12000, description: "Old Laptop Sold on OLX", category: "Income",
        date: new Date(new Date().setDate(now.getDate() - 10)), accountId: personalAccountId, status: "COMPLETED", userId
    });
    transactions.push({
        type: "INCOME", amount: 5500, description: "Referral Bonus: Cloud Hosting", category: "Salary",
        date: new Date(new Date().setDate(now.getDate() - 35)), accountId: workAccountId, status: "COMPLETED", userId
    });

    try {
        const created = await prisma.transaction.createMany({ data: transactions });
        console.log(`Successfully added ${created.count} more mixed realistic transactions.`);

        // Sync Balances
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

addMoreRealisticMixedData();
