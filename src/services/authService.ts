import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
}

export const authService = {
  // Đăng nhập bằng email + password
  signIn: async (email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { user: null, error: "Supabase chưa được cấu hình." };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Việt hóa thông báo lỗi phổ biến
      if (error.message.includes("Invalid login credentials")) {
        return { user: null, error: "Email hoặc mật khẩu không đúng." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { user: null, error: "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư." };
      }
      return { user: null, error: error.message };
    }
    if (!data.user) return { user: null, error: "Đăng nhập thất bại." };
    return {
      user: { id: data.user.id, email: data.user.email ?? "" },
      error: null,
    };
  },

  // Đăng xuất
  signOut: async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  // Lấy user hiện tại từ session (không gọi network)
  getCurrentUser: async (): Promise<AuthUser | null> => {
    if (!supabase || !isSupabaseConfigured) return null;
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    return { id: user.id, email: user.email ?? "" };
  },

  // Lắng nghe thay đổi trạng thái auth (login/logout)
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => {
    if (!supabase || !isSupabaseConfigured) return { unsubscribe: () => {} };
    const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (session?.user) {
        callback({ id: session.user.id, email: session.user.email ?? "" });
      } else {
        callback(null);
      }
    });
    return data.subscription;
  },
};
