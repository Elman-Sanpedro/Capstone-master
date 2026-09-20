// The cart is persisted in localStorage, which is shared by every account
// that logs into the same browser. Scoping the key by user id keeps one
// customer's cart from leaking into another customer's session after a
// logout/login on the same device.
export function getCartStorageKey(userId: number | string | null | undefined): string {
    return userId ? `mejeck_cart_${userId}` : 'mejeck_cart_guest';
}
