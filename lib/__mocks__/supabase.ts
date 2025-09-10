export const supabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => {
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    }),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
    insert: jest.fn().mockResolvedValue({ data: [{}], error: null }),
    update: jest.fn().mockResolvedValue({ data: [{}], error: null }),
    delete: jest.fn().mockResolvedValue({ data: [{}], error: null }),
  })),
};
