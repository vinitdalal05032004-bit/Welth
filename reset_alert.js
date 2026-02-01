const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAlert() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) return;

        await prisma.budget.updateMany({
            where: { userId: user.id },
            data: { lastAlertSent: null }
        });

        console.log(`Alert status reset for user: ${user.email}`);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAlert();
