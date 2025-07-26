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
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
