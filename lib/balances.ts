export interface PaymentLike {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

export interface Settlement {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

/**
 * Расчёт минимального числа переводов по нетто-балансам.
 *
 * Алгоритм: считаем чистый баланс каждого участника
 * (получил - должен). Плательщики (net < 0) гасятся крупнейшим
 * кредитором (net > 0) — жадное сопоставление максимальных сумм.
 * Количество переводов = max(#должников, #кредиторов), что минимально.
 */
export function settleDebts(payments: PaymentLike[]): Settlement[] {
  const net = new Map<string, number>();

  for (const p of payments) {
    net.set(p.from_user_id, (net.get(p.from_user_id) ?? 0) - p.amount);
    net.set(p.to_user_id, (net.get(p.to_user_id) ?? 0) + p.amount);
  }

  const debtors: { user_id: string; amount: number }[] = [];
  const creditors: { user_id: string; amount: number }[] = [];

  for (const [user_id, balance] of net) {
    const rounded = round2(balance);
    if (rounded > 0.004) creditors.push({ user_id, amount: rounded });
    else if (rounded < -0.004) debtors.push({ user_id, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const amount = round2(Math.min(debtors[d].amount, creditors[c].amount));
    if (amount > 0.004) {
      settlements.push({
        from_user_id: debtors[d].user_id,
        to_user_id: creditors[c].user_id,
        amount,
      });
    }
    debtors[d].amount = round2(debtors[d].amount - amount);
    creditors[c].amount = round2(creditors[c].amount - amount);

    if (debtors[d].amount <= 0.004) d++;
    if (creditors[c].amount <= 0.004) c++;
  }

  return settlements;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
