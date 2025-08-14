export const getWsPriceRequest = (exchange: string, server: string): string => {
    return `SubAdd:0~${exchange}~${server}`
}
