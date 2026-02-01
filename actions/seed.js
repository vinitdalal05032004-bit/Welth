"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [4000, 5000], isRecurring: true },
    { name: "freelance", range: [1000, 3000], isRecurring: false },
    { name: "investments", range: [500, 2000], isRecurring: false },
    { name: "other-income", range: [100, 1000], isRecurring: false },
  ],
  EXPENSE: [
    // Essentials
    { name: "housing", range: [1000, 1500], isRecurring: true },
    { name: "transportation", range: [50, 200], isRecurring: true },
    { name: "groceries", range: [100, 300], isRecurring: true },
    { name: "utilities", range: [50, 150], isRecurring: true },
    { name: "healthcare", range: [50, 300], isRecurring: false },
    // Lifestyle
    { name: "dining-out", range: [20, 100], isRecurring: false },
    { name: "shopping", range: [50, 500], isRecurring: false },
    { name: "entertainment", range: [20, 200], isRecurring: false },
    { name: "travel", range: [200, 800], isRecurring: false },
    { name: "fitness", range: [30, 80], isRecurring: true },
    { name: "subscriptions", range: [10, 50], isRecurring: true },
    { name: "education", range: [50, 300], isRecurring: false },
    { name: "gadgets", range: [100, 1000], isRecurring: false },
    { name: "gifts", range: [20, 100], isRecurring: false },
  ],
};

function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type, excludeCategories = []) {
  const categories = CATEGORIES[type];
  const availableCategories = categories.filter(
    (c) => !excludeCategories.includes(c.name)
  );

  // Fallback if all are excluded, though unlikely in this use case
  const pool = availableCategories.length > 0 ? availableCategories : categories;

  const category = pool[Math.floor(Math.random() * pool.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return { success: false, error: "No user found. Please sign in first." };
    }

    const account = await db.account.findFirst({
      where: { userId: user.id },
    });

    if (!account) {
      return { success: false, error: "No account found. Please create an account first." };
    }

    // Clear existing transactions to ensure clean data for the chart
    await db.transaction.deleteMany({
      where: { accountId: account.id },
    });

    // 1. Set a Default Budget
    // Default budget amount - User requested realistic values
    const BUDGET_AMOUNT = 5000;

    // Create or update budget
    await db.budget.upsert({
      where: { userId: user.id },
      update: { amount: BUDGET_AMOUNT },
      create: {
        userId: user.id,
        amount: BUDGET_AMOUNT,
      }
    });

    // 2. Generate Expenses to hit ~90% of Budget
    const TARGET_EXPENSE = BUDGET_AMOUNT * 0.90; // 4500
    let currentExpense = 0;
    const transactions = [];

    // Force inclusion of at least one transaction from EACH expense category
    // This ensures the pie chart has maximum slices/diversity
    const expenseCategories = CATEGORIES.EXPENSE;

    for (const catConfig of expenseCategories) {
      // Stop if we already hit the target (unlikely with small initial amounts)
      if (currentExpense >= TARGET_EXPENSE) break;

      const type = "EXPENSE";
      const category = catConfig.name;
      // Take a smaller random amount to leave room for others
      const minAmt = Math.min(catConfig.range[0], 50);
      const maxAmt = Math.min(catConfig.range[1], 150);

      let amount = getRandomAmount(minAmt, maxAmt);

      if (currentExpense + amount > TARGET_EXPENSE) {
        amount = TARGET_EXPENSE - currentExpense;
      }

      if (amount > 0) {
        currentExpense += amount;
        const daysAgo = Math.floor(Math.random() * 30);
        const date = subDays(new Date(), daysAgo);

        transactions.push({
          id: crypto.randomUUID(),
          type,
          amount: Number(amount.toFixed(2)),
          description: `Payment for ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: user.id,
          accountId: account.id,
          createdAt: date,
          updatedAt: date,
        });
      }
    }

    // Now fill the remaining budget with random categories
    // Exclude 'housing' from random filler to prevent oversized slices
    while (currentExpense < TARGET_EXPENSE) {
      const type = "EXPENSE";
      const { category, amount: rawAmount } = getRandomCategory(type, ["housing"]);

      let amount = rawAmount;
      if (currentExpense + amount > TARGET_EXPENSE) {
        amount = TARGET_EXPENSE - currentExpense;
      }

      if (amount < 2) break;

      currentExpense += amount;

      const daysAgo = Math.floor(Math.random() * 30);
      const date = subDays(new Date(), daysAgo);

      transactions.push({
        id: crypto.randomUUID(),
        type,
        amount: Number(amount.toFixed(2)),
        description: `Payment for ${category}`,
        date,
        category,
        status: "COMPLETED",
        userId: user.id,
        accountId: account.id,
        createdAt: date,
        updatedAt: date,
      });
    }

    // 3. Add Some Income to balance it out (so balance isn't negative)
    // Add income slightly more than target expense so they have savings
    const TOTAL_INCOME = TARGET_EXPENSE * 1.2;
    let currentIncome = 0;

    while (currentIncome < TOTAL_INCOME) {
      const type = "INCOME";
      const { category, amount: rawAmount } = getRandomCategory(type);
      const amount = rawAmount; // Keep raw random for income

      currentIncome += amount;
      const daysAgo = Math.floor(Math.random() * 30);
      const date = subDays(new Date(), daysAgo);

      transactions.push({
        id: crypto.randomUUID(),
        type,
        amount: Number(amount.toFixed(2)),
        description: `Received ${category}`,
        date,
        category,
        status: "COMPLETED",
        userId: user.id,
        accountId: account.id,
        createdAt: date,
        updatedAt: date,
      });
    }

    // Insert transactions
    await db.transaction.createMany({
      data: transactions,
    });

    // Update account balance
    const finalBalance = currentIncome - currentExpense;
    await db.account.update({
      where: { id: account.id },
      data: { balance: finalBalance },
    });

    return {
      success: true,
      message: `Database seeded! Budget set to ₹${BUDGET_AMOUNT}. Expenses generated: ₹${currentExpense.toFixed(2)} (${((currentExpense / BUDGET_AMOUNT) * 100).toFixed(1)}%). Created ${transactions.length} transactions.`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}    
