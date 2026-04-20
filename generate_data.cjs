const fs = require('fs');

const expenseNames = ["Аренда", "Продукты питания", "Интернет и связь", "Транспорт", "Кафе и рестораны", "Одежда", "Хобби", "Аптека", "Автомобиль"];

let allData = {};

// Генерируем 51 месяц (с января 2022 по март 2026)
for (let year = 2022; year <= 2026; year++) {
  let maxMonth = (year === 2026) ? 3 : 12;
  for (let month = 1; month <= maxMonth; month++) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    
    // Доход от 100k до 200k
    const income = Math.floor(Math.random() * 100000) + 100000; 
    // Цель накоплений 10-25% от дохода
    const savingsGoal = Math.floor(income * (Math.random() * 0.15 + 0.1)); 
    
    const numExpenses = Math.floor(Math.random() * 5) + 4; // 4 - 8 категорий трат
    let expenses = [];
    let totalExpenses = 0;
    
    let availableNames = [...expenseNames].sort(() => 0.5 - Math.random());

    for (let i = 0; i < numExpenses; i++) {
      const expAmount = Math.floor(Math.random() * 20000) + 3000;
      expenses.push({
        id: Math.random().toString(36).substring(2, 9),
        name: availableNames.pop(),
        amount: expAmount
      });
      totalExpenses += expAmount;
    }

    if (Math.random() > 0.75) {
       const overspentAmount = income - totalExpenses - savingsGoal + (Math.floor(Math.random() * 15000) + 3000);
       expenses.push({
         id: Math.random().toString(36).substring(2, 9),
         name: "Крупная/Спонтанная покупка",
         amount: overspentAmount
       });
       totalExpenses += overspentAmount;
    }

    allData[monthKey] = {
      income,
      savingsGoal,
      expenses
    };
  }
}

// РАСЧЕТ И ИМИТАЦИЯ СТАРОГО ID ДЛЯ ОЦЕНКИ РАЗМЕРА:
let oldHistory = [];
let idCounter = 1;

let oldAllData = {};
for (const [key, data] of Object.entries(allData)) {
    const totalExp = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0);
    oldHistory.push({
      id: idCounter++,
      date: "Декабрь 2025", 
      monthKey: key,
      income: data.income,
      totalExpenses: totalExp,
      saved: data.savingsGoal,
      leftover: data.income - totalExp - data.savingsGoal
    });
    
    oldAllData[key] = {
        income: data.income,
        savingsGoal: data.savingsGoal,
        expenses: data.expenses.map(exp => ({ id: Date.now() + Math.random(), name: exp.name, amount: exp.amount }))
    };
}

const oldExportObj = {
  allData: oldAllData,
  history: oldHistory,
  currency: "RUB",
  includeLeftover: true,
  theme: "dark",
  language: "RU"
};
const oldSize = JSON.stringify(oldExportObj).length;

// НОВАЯ СХЕМА
const newExportObj = {
  allData,
  currency: "RUB",
  includeLeftover: true,
  theme: "dark",
  language: "RU"
};
const newSize = JSON.stringify(newExportObj).length;
const diff = oldSize - newSize;
const perc = ((diff / oldSize) * 100).toFixed(1);

fs.writeFileSync('test_data_50_months.json', JSON.stringify(newExportObj, null, 2));

console.log('JSON file test_data_50_months.json created successfully in V2 compact layout!');
console.log(`Old size (approx): ${oldSize} bytes`);
console.log(`New size: ${newSize} bytes`);
console.log(`Size reduced by: ${diff} bytes (${perc}%)`);
