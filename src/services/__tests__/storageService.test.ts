import { describe, it, expect, beforeEach } from "vitest";
import { calculateExpiryDate } from "../../utils/date";

// Mock localStorage trước khi import storage và storageService
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Import sau khi đã mock localStorage
import { storage } from "../../storage/localStorage";
import { storageService } from "../storageService";

// Lấy ngày hôm nay dưới dạng yyyy-MM-dd
const todayStr = new Date().toISOString().split("T")[0];

describe("Nghiệp vụ Xử lý Ngày tháng (Date Utilities)", () => {
  it("Tính ngày hết hạn 1, 6 và 12 tháng thông thường", () => {
    expect(calculateExpiryDate("2026-01-15", 1)).toBe("2026-02-15");
    expect(calculateExpiryDate("2026-01-15", 6)).toBe("2026-07-15");
    expect(calculateExpiryDate("2026-01-15", 12)).toBe("2027-01-15");
  });

  it("Tính ngày hết hạn chính xác tại các ngày cuối tháng", () => {
    // 31/01 cộng 1 tháng phải ra ngày cuối tháng 2 (28 hoặc 29 tùy năm)
    expect(calculateExpiryDate("2026-01-31", 1)).toBe("2026-02-28");
    // Năm nhuận 2024: 31/01 cộng 1 tháng -> 29/02
    expect(calculateExpiryDate("2024-01-31", 1)).toBe("2024-02-29");
    // 29/02/2024 cộng 12 tháng (1 năm) -> 28/02/2025
    expect(calculateExpiryDate("2024-02-29", 12)).toBe("2025-02-28");
  });
});

describe("Nghiệp vụ Quản lý Đăng ký và Tài khoản AI", () => {
  beforeEach(() => {
    localStorage.clear();
    // Khởi tạo database trắng
    storage.purgeAll();
    
    // Thêm sản phẩm demo
    storageService.createProduct({
      name: "ChatGPT Plus Test",
      description: "Demo",
      isActive: true,
    });
  });

  it("Mặc định thời hạn khách hàng là 12 tháng nếu không chọn", () => {
    const products = storageService.getProducts();
    const product = products[0];

    // Tạo tài khoản AI gốc
    const account = storageService.createAccount({
      productId: product.id,
      accountName: "ChatGPT Gốc 24T",
      loginEmail: "chatgpt@test.com",
      purchaseDate: todayStr,
      durationMonths: 12,
      status: "active",
    });

    // Tạo khách hàng
    const customer = storageService.createCustomer({
      name: "Khách Hàng Test",
      email: "khach@test.com",
    });

    // Tạo subscription và KHÔNG truyền durationMonths
    const subscription = storageService.createSubscription({
      customerId: customer.id,
      aiAccountId: account.id,
      registrationDate: todayStr,
      status: "active",
      // Không truyền durationMonths để test mặc định
    } as any);

    expect(subscription.durationMonths).toBe(12);
    expect(subscription.expiryDate).toBe(calculateExpiryDate(todayStr, 12));
  });

  it("Không thể cấp khách hàng thứ 6 cho cùng một tài khoản AI", () => {
    const products = storageService.getProducts();
    const product = products[0];

    const account = storageService.createAccount({
      productId: product.id,
      accountName: "ChatGPT Gốc 5 Slots",
      purchaseDate: todayStr,
      durationMonths: 12,
      status: "active",
    });

    // Tạo 6 khách hàng
    const customers = Array.from({ length: 6 }).map((_, idx) =>
      storageService.createCustomer({ name: `Khách ${idx + 1}` })
    );

    // Đăng ký 5 khách hàng đầu tiên
    for (let i = 0; i < 5; i++) {
      storageService.createSubscription({
        customerId: customers[i].id,
        aiAccountId: account.id,
        registrationDate: todayStr,
        durationMonths: 6, // hạn dài để không bị expired
        status: "active",
      });
    }

    // Cấp khách hàng thứ 6 phải thất bại
    expect(() => {
      storageService.createSubscription({
        customerId: customers[5].id,
        aiAccountId: account.id,
        registrationDate: todayStr,
        durationMonths: 6,
        status: "active",
      });
    }).toThrow("Tài khoản AI này đã đầy chỗ (5/5). Không thể cấp thêm khách hàng mới.");
  });

  it("Vị trí (slot) được giải phóng khi đăng ký bị hủy hoặc hết hạn", () => {
    const products = storageService.getProducts();
    const product = products[0];

    const account = storageService.createAccount({
      productId: product.id,
      accountName: "ChatGPT Gốc Giải phóng Slot",
      purchaseDate: todayStr,
      durationMonths: 12,
      status: "active",
    });

    const customers = Array.from({ length: 6 }).map((_, idx) =>
      storageService.createCustomer({ name: `Khách ${idx + 1}` })
    );

    // Đăng ký 5 khách hàng
    const subs = [];
    for (let i = 0; i < 5; i++) {
      const sub = storageService.createSubscription({
        customerId: customers[i].id,
        aiAccountId: account.id,
        registrationDate: todayStr,
        durationMonths: 12,
        status: "active",
      });
      subs.push(sub);
    }

    // Kiểm tra xem usedSlots = 5
    let updatedAccount = storageService.getAccountById(account.id);
    expect(updatedAccount?.usedSlots).toBe(5);

    // Hủy 1 đăng ký
    storageService.cancelSubscription(subs[0].id);

    // usedSlots phải giảm xuống 4
    updatedAccount = storageService.getAccountById(account.id);
    expect(updatedAccount?.usedSlots).toBe(4);

    // Bây giờ có thể cấp cho khách thứ 6
    expect(() => {
      storageService.createSubscription({
        customerId: customers[5].id,
        aiAccountId: account.id,
        registrationDate: todayStr,
        durationMonths: 12,
        status: "active",
      });
    }).not.toThrow();

    updatedAccount = storageService.getAccountById(account.id);
    expect(updatedAccount?.usedSlots).toBe(5);
  });

  it("Không thể cấp tài khoản AI đã hết hạn hoặc bị vô hiệu hóa", () => {
    const products = storageService.getProducts();
    const product = products[0];

    // Tài khoản đã bị vô hiệu hóa (disabled)
    const disabledAccount = storageService.createAccount({
      productId: product.id,
      accountName: "Tài Khoản Disabled",
      purchaseDate: todayStr,
      durationMonths: 12,
      status: "disabled",
    });

    const customer = storageService.createCustomer({ name: "Khách Test" });

    expect(() => {
      storageService.createSubscription({
        customerId: customer.id,
        aiAccountId: disabledAccount.id,
        registrationDate: todayStr,
        durationMonths: 1,
        status: "active",
      });
    }).toThrow("Không thể cấp tài khoản đã hết hạn hoặc đang bị vô hiệu hóa.");

    // Tài khoản đã hết hạn (expired)
    // Tạo tài khoản trong quá khứ đã quá hạn
    const expiredAccount = storageService.createAccount({
      productId: product.id,
      accountName: "Tài Khoản Hết Hạn",
      purchaseDate: "2025-01-01",
      durationMonths: 6, // Expiry: 2025-07-01
      status: "active", // Hệ thống sẽ tự động cập nhật expired
    });

    expect(() => {
      storageService.createSubscription({
        customerId: customer.id,
        aiAccountId: expiredAccount.id,
        registrationDate: todayStr,
        durationMonths: 1,
        status: "active",
      });
    }).toThrow("Không thể cấp tài khoản đã hết hạn hoặc đang bị vô hiệu hóa.");
  });

  it("Không thể tạo đăng ký có ngày hết hạn vượt quá tài khoản AI", () => {
    const products = storageService.getProducts();
    const product = products[0];

    // Tài khoản AI hết hạn sau 1 tháng
    const account = storageService.createAccount({
      productId: product.id,
      accountName: "ChatGPT Gốc Hạn Ngắn",
      purchaseDate: todayStr,
      durationMonths: 1,
      status: "active",
    });

    const customer = storageService.createCustomer({ name: "Khách Test" });

    // Đăng ký của khách ngày hôm nay nhưng hạn 6 tháng -> vượt quá hạn account 1 tháng
    expect(() => {
      storageService.createSubscription({
        customerId: customer.id,
        aiAccountId: account.id,
        registrationDate: todayStr,
        durationMonths: 6,
        status: "active",
      });
    }).toThrow(/ngày hết hạn của khách.*không được vượt quá ngày hết hạn của tài khoản AI/i);
  });
});
