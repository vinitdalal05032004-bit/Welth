const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addRealisticWorkData() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";

    // Re-mapping categories to only use existing ones or generic ones that look like categories
    const transactions = [
        // --- INCOME ---
        { type: "INCOME", amount: 25000, desc: "Q1 Retainer Payment - Client A", cat: "Income", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { type: "INCOME", amount: 15000, desc: "Final Project Delivery - Client B", cat: "Income", date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { type: "INCOME", amount: 8500, desc: "Consulting Workshop Fee", cat: "Income", date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
        { type: "INCOME", amount: 12000, desc: "Recurring Maintenance - Client C", cat: "Income", date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },

        // --- EXPENSES ---
        { type: "EXPENSE", amount: 1500, desc: "Adobe Creative Cloud Annual", cat: "Software", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 800, desc: "Vercel Pro Subscription", cat: "Software", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 2200, desc: "GitHub Enterprise Seats", cat: "Software", date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 5000, desc: "Contractor - UI Design Work", cat: "Professional Services", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 3500, desc: "Copywriting Services - Marketing", cat: "Professional Services", date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 4500, desc: "LinkedIn Sales Navigator", cat: "Software", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 1200, desc: "Email Marketing Tool (Mailchimp)", cat: "Software", date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 2800, desc: "Flight to Client Site", cat: "Travel", date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 1400, desc: "Hotel Stay - 2 Nights", cat: "Travel", date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) },
        { type: "EXPENSE", amount: 650, desc: "Premium Workspace Day Pass", cat: "Office", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ];

    try {
        const data = transactions.map(t => ({
            type: t.type,
            amount: t.amount,
            description: t.desc,
            date: t.date,
            category: t.cat,
            userId: userId,
            accountId: workAccountId,
            status: "COMPLETED"
        }));

        const created = await prisma.transaction.createMany({ data });
        console.log(`Successfully added ${created.count} realistic transactions to Work account.`);

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
        console.log(`Synced balance for Work: ₹${balance}`);

    } catch (error) {
        console.error("Prisma error details:", JSON.stringify(error, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

addRealisticWorkData();
