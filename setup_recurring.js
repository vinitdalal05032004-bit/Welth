const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupRecurring() {
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";
    const personalAccountId = "32ed7b83-030e-4141-9e41-cf44d0d4e439";
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";

    const recurringTransactions = [
        {
            type: "EXPENSE",
            amount: 649,
            description: "Netflix Subscription",
            date: new Date(),
            category: "Entertainment",
            userId,
            accountId: personalAccountId,
            isRecurring: true,
            recurringInterval: "MONTHLY",
            nextRecurringDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            status: "COMPLETED"
        },
        {
            type: "EXPENSE",
            amount: 299,
            description: "Disney+ Hotstar",
            date: new Date(),
            category: "Entertainment",
            userId,
            accountId: personalAccountId,
            isRecurring: true,
            recurringInterval: "MONTHLY",
            nextRecurringDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            status: "COMPLETED"
        },
        {
            type: "INCOME",
            amount: 75000,
            description: "Monthly Salary",
            date: new Date(),
            category: "Salary",
            userId,
            accountId: workAccountId,
            isRecurring: true,
            recurringInterval: "MONTHLY",
            nextRecurringDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            status: "COMPLETED"
        }
    ];

    try {
        for (const tx of recurringTransactions) {
            await prisma.transaction.create({ data: tx });
        }
        console.log("Successfully setup recurring transactions.");
    } catch (error) {
        console.error("Error setting up recurring transactions:", error);
    } finally {
        await prisma.$disconnect();
    }
}

setupRecurring();
