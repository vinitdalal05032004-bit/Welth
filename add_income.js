const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addIncome() {
    const workAccountId = "4e6bf5aa-247f-4104-ad5d-dd17cf690a36";
    const userId = "6cee7505-ca93-480d-9118-55af965d65e6";

    try {
        await prisma.transaction.create({
            data: {
                type: "INCOME",
                amount: 5000,
                description: "Project Payment",
                date: new Date(),
                category: "Salary",
                userId,
                accountId: workAccountId,
                status: "COMPLETED"
            }
        });

        console.log("Added 5000 income to Work account.");

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

addIncome();
