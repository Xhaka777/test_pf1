export const MINIMUM_QUANTITY = 0.01;

export const roundQuantity = (
    amount: number,
    minimumQuantity = MINIMUM_QUANTITY
): number => {
    if(!amount) {
        return amount;
    }

    const adjustedAmount = Math.max(amount, minimumQuantity);
    return Math.round(adjustedAmount * 100) / 100;
}