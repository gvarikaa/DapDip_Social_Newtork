/**
 * LocalStorage polyfill for server-side environments
 * 
 * This is needed because @supabase/auth-helpers tries to access localStorage even in server environments
 * Use this to prevent errors when running in SSR/SSG modes
 */

export class LocalStoragePolyfill implements Storage {
  private data: Record<string, string>;

  constructor() {
    this.data = {};
  }

  public get length(): number {
    return Object.keys(this.data).length;
  }

  public clear(): void {
    this.data = {};
  }

  public getItem(key: string): string | null {
    return key in this.data ? this.data[key] : null;
  }

  public key(index: number): string | null {
    const keys = Object.keys(this.data);
    return index >= 0 && index < keys.length ? keys[index] : null;
  }

  public removeItem(key: string): void {
    delete this.data[key];
  }

  public setItem(key: string, value: string): void {
    this.data[key] = value;
  }
}

// Use this polyfill in server environments
if (typeof window === 'undefined') {
  global.localStorage = new LocalStoragePolyfill();
}