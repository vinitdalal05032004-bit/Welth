const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWorkExpenses() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";

    const expenses = [
        { amount: 1200, desc: "New Office Chair", cat: "Office Supplies", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { amount: 450, desc: "Cloud Server Hosting", cat: "Software", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { amount: 800, desc: "Client Meeting Dinner", cat: "Food", date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
        { amount: 2500, desc: "Facebook Ad Campaign", cat: "Marketing", date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
        { amount: 300, desc: "Business Business Cards", cat: "Office Supplies", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { amount: 1500, desc: "Travel to Conference", cat: "Transportation", date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
        { amount: 200, desc: "Zoom Subscription", cat: "Software", date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
        { amount: 600, desc: "Printer Ink & Paper", cat: "Office Supplies", date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
        { amount: 4000, desc: "Laptops Upgrade RAM", cat: "Office Supplies", date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
        { amount: 120, desc: "Domain Renewal", cat: "Software", date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { amount: 950, desc: "Team Lunch", cat: "Food", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { amount: 2100, desc: "Google Ads", cat: "Marketing", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
    ];

    try {
        const data = expenses.map(e => ({
            type: "EXPENSE",
            amount: e.amount,
            description: e.desc,
            date: e.date,
            category: e.cat,
            userId,
            accountId: workAccountId,
            status: "COMPLETED"
        }));

        const created = await prisma.transaction.createMany({
            data: data
        });

        console.log(`Successfully added ${created.count} expenses to the Work account.`);

        // Sync balance
        const totalIncome = await prisma.transaction.aggregate({
            where: { accountId: workAccountId, type: "INCOME" },
            _sum: { amount: true }
        });
        const totalExpense = await prisma.transaction.aggregate({
            where: { accountId: workAccountId, type: "EXPENSE" },
            _sum: { amount: true }
        });
        const balance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);

        await prisma.account.update({
            where: { id: workAccountId },
            data: { balance }
        });
        console.log(`Synced balance for Work: ${balance}`);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

addWorkExpenses();
