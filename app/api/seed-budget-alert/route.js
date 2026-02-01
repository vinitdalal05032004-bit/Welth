import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

export async function GET() {
    try {
        // 1. Get User and Default Account
        const user = await db.user.findFirst({
            include: {
                accounts: {
                    where: { isDefault: true },
                },
            },
        });

        if (!user || user.accounts.length === 0) {
            return Response.json({ success: false, error: "No user or default account found" });
        }

        const defaultAccount = user.accounts[0];

        // 2. Ensure Budget Exists (Set to 50,000 if not present)
        let budget = await db.budget.findFirst({
            where: { userId: user.id },
        });

        if (!budget) {
            budget = await db.budget.create({
                data: {
                    userId: user.id,
                    amount: 50000,
                },
            });
        }

        // 3. Clear existing expenses for this month to ensure precise calculation
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        await db.transaction.deleteMany({
            where: {
                userId: user.id,
                accountId: defaultAccount.id,
                type: "EXPENSE",
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        // 4. Create Expenses totaling exactly 90% of Budget distributed across categories
        const budgetAmount = Number(budget.amount);
        const targetExpense = budgetAmount * 0.90;

        // Distribution ratios
        const categories = [
            { name: "housing", ratio: 0.35 },    // 35%
            { name: "groceries", ratio: 0.20 },  // 20%
            { name: "transportation", ratio: 0.15 }, // 15%
            { name: "entertainment", ratio: 0.10 },  // 10%
            { name: "utilities", ratio: 0.10 },      // 10%
        ];

        let currentTotal = 0;

        // Create transactions for all except the last one
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            let amount;

            if (i === categories.length - 1) {
                // Last item takes the remainder to ensure exact precision
                amount = targetExpense - currentTotal;
            } else {
                amount = targetExpense * cat.ratio;
                currentTotal += amount;
            }

            await db.transaction.create({
                data: {
                    type: "EXPENSE",
                    amount: amount,
                    description: `${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)} Expense`,
                    date: new Date(),
                    category: cat.name,
                    userId: user.id,
                    accountId: defaultAccount.id,
                    status: "COMPLETED",
                },
            });
        }

        // 5. Reset Budget Alert Timestamp to allow immediate Alert
        await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: null },
        });

        // 6. Run Alert Logic (Extracted from Inngest function)
        const percentageUsed = (targetExpense / budgetAmount) * 100;
        let emailSent = false;

        if (percentageUsed >= 80) { // Threshold check
            await sendEmail({
                to: user.email,
                subject: `Budget Alert for ${defaultAccount.name}`,
                react: EmailTemplate({
                    userName: user.name || "User",
                    type: "budget-alert",
                    data: {
                        percentageUsed,
                        budgetAmount: budgetAmount.toFixed(1),
                        totalExpenses: targetExpense.toFixed(1),
                        accountName: defaultAccount.name,
                    },
                }),
            });

            // Update last alert sent
            await db.budget.update({
                where: { id: budget.id },
                data: { lastAlertSent: new Date() },
            });
            emailSent = true;
        }

        return Response.json({
            success: true,
            message: `Budget set to ₹${budgetAmount}. Expense created for ₹${targetExpense} (90%). Alert logic executed.`,
            emailSent,
            userEmail: user.email
        });

    } catch (error) {
        console.error("Error seeding budget alert:", error);
        return Response.json({ success: false, error: error.message });
    }
}
