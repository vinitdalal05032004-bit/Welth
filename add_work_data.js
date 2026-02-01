const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addData() {
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";

    const categories = ["Office Supplies", "Software", "Travel", "Consulting", "Meals", "Marketing"];
    const descriptions = [
        "Monthly SaaS Subscription",
        "Coffee for team",
        "Desk Organizer",
        "Client Meeting Lunch",
        "New Laptop Stand",
        "Uber to Office",
        "LinkedIn Premium",
        "Printing Services",
        "AWS Bill",
        "Google Workspace"
    ];

    try {
        const transactions = [];
        for (let i = 0; i < 15; i++) {
            transactions.push({
                type: "EXPENSE",
                amount: (Math.random() * 200 + 10).toFixed(2),
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Last 30 days
                category: categories[Math.floor(Math.random() * categories.length)],
                userId,
                accountId: workAccountId,
                status: "COMPLETED"
            });
        }

        const created = await prisma.transaction.createMany({
            data: transactions
        });

        console.log(`Successfully added ${created.count} transactions to Work account.`);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

addData();
