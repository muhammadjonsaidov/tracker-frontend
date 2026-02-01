export const decodeJwtPayload = (token: string): any | null => {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    try {
        const json = atob(padded);
        return JSON.parse(json);
    } catch {
        return null;
    }
};

export const hasAdminRole = (payload: any): boolean => {
    if (!payload) return false;
    const roles = payload.roles ?? payload.authorities ?? payload.role;
    const list = Array.isArray(roles) ? roles : roles ? [roles] : [];
    return list.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN');
};
