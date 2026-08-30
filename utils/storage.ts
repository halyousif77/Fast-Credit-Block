export const storage = {
  async getItem(key: string) {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(key);
  },

  async setItem(key: string, value: string) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(key, value);
  },

  async removeItem(key: string) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.removeItem(key);
  },
};