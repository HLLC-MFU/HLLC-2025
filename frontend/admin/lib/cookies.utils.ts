export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        return decodeURIComponent(parts.pop()!.split(';').shift()!);
    }

    return null;
}

export function isTokenValid(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000); // in seconds

        return payload.exp && payload.exp > currentTime;
    } catch (error) {

        return false;
    }
}