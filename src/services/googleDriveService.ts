// Dịch vụ tích hợp Google Drive & Google Sheets REST API client-side

export type GoogleUser = {
  email: string;
  name?: string;
  picture?: string;
};

export const googleDriveService = {
  /**
   * Yêu cầu người dùng đăng nhập Google OAuth2 thông qua Google Identity Services SDK
   */
  requestToken: (clientId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Kiểm tra xem SDK đã tải thành công hay chưa
      // @ts-ignore
      if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
        reject(new Error("SDK Google chưa được tải hoặc bị chặn bởi trình duyệt (Adblock). Vui lòng thử lại."));
        return;
      }

      try {
        // @ts-ignore
        const client = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
          callback: (response: any) => {
            if (response.error_subtype) {
              reject(new Error(`Lỗi xác thực: ${response.error}`));
              return;
            }
            if (response.access_token) {
              resolve(response.access_token);
            } else {
              reject(new Error("Không nhận được mã xác thực Access Token từ Google."));
            }
          },
          error_callback: (err: any) => {
            reject(new Error(`Lỗi Google OAuth2: ${err.message}`));
          }
        });
        
        client.requestAccessToken({ prompt: "consent" });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Lấy thông tin email của tài khoản Google đã đăng nhập
   */
  getUserInfo: async (accessToken: string): Promise<GoogleUser> => {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Không thể truy xuất thông tin tài khoản Google.");
    return await res.json();
  },

  /**
   * Tìm kiếm file backup JSON trên Google Drive
   */
  findBackupFile: async (accessToken: string): Promise<{ id: string; modifiedTime: string } | null> => {
    const query = encodeURIComponent("name='ai_account_hub_backup.json' and trashed=false");
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error("Không thể truy cập danh sách tệp Google Drive.");
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        modifiedTime: data.files[0].modifiedTime,
      };
    }
    return null;
  },

  /**
   * Tải nội dung tệp backup JSON từ Google Drive
   */
  downloadBackupFile: async (accessToken: string, fileId: string): Promise<any> => {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Không thể tải tệp sao lưu từ Google Drive.");
    return await res.json();
  },

  /**
   * Tải tệp backup JSON mới lên Google Drive (Tạo mới hoặc ghi đè)
   */
  uploadBackupFile: async (
    accessToken: string,
    fileContent: string,
    fileId?: string
  ): Promise<string> => {
    const metadata = {
      name: "ai_account_hub_backup.json",
      mimeType: "application/json",
    };

    if (fileId) {
      // GHI ĐÈ FILE CŨ (UPDATE CONTENT)
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: fileContent,
        }
      );
      if (!res.ok) throw new Error("Không thể cập nhật tệp sao lưu trên Google Drive.");
      await res.json();
      return fileId;
    } else {
      // TẠO FILE MỚI (CREATE)
      // Tạo metadata trước
      const metaRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });
      if (!metaRes.ok) throw new Error("Không thể khởi tạo tệp sao lưu trên Google Drive.");
      const metaData = await metaRes.json();
      const newFileId = metaData.id;

      // Đẩy nội dung file lên
      const contentRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: fileContent,
        }
      );
      if (!contentRes.ok) throw new Error("Không thể tải nội dung sao lưu lên Google Drive.");
      return newFileId;
    }
  },

  /**
   * Tìm kiếm tệp Google Sheets đã có trên Google Drive
   */
  findSpreadsheet: async (accessToken: string): Promise<string | null> => {
    const query = encodeURIComponent(
      "name='AI_Account_Hub_Database' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
    );
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Không thể truy cập danh sách bảng tính trên Google Drive.");
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  },

  /**
   * Tạo tệp Google Sheets mới với 3 tabs định sẵn
   */
  createSpreadsheet: async (accessToken: string): Promise<string> => {
    const body = {
      properties: {
        title: "AI_Account_Hub_Database",
      },
      sheets: [
        { properties: { title: "1. Sản phẩm AI" } },
        { properties: { title: "2. Tài khoản gốc" } },
        { properties: { title: "3. Khách hàng & Cấp phát" } },
      ],
    };

    const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Không thể tạo tệp Google Sheets mới.");
    const data = await res.json();
    return data.spreadsheetId;
  },

  /**
   * Đồng bộ hóa dữ liệu từ Local ghi đè lên tệp Google Sheets trực tuyến
   */
  syncToGoogleSheets: async (
    accessToken: string,
    spreadsheetId: string,
    tables: {
      products: any[];
      accounts: any[];
      subscriptions: any[];
    }
  ): Promise<void> => {
    // 1. Làm sạch (Clear) dữ liệu cũ trên cả 3 tabs để tránh đè thiếu dòng
    const clearBody = {
      ranges: ["'1. Sản phẩm AI'!A1:Z500", "'2. Tài khoản gốc'!A1:Z550", "'3. Khách hàng & Cấp phát'!A1:Z1000"],
    };
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clearBody),
      }
    );
    if (!clearRes.ok) throw new Error("Lỗi khi làm sạch dữ liệu cũ trên Google Sheets.");

    // 2. Định dạng dữ liệu ghi
    const productsData = [
      ["Mã sản phẩm", "Tên sản phẩm AI", "Mô tả chi tiết", "Trạng thái cung cấp"],
      ...tables.products.map((p) => [
        p.id,
        p.name,
        p.description || "",
        p.isActive ? "Đang hoạt động" : "Ngừng cung cấp",
      ]),
    ];

    const accountsData = [
      [
        "Tên tài khoản gốc",
        "Email đăng nhập",
        "Sản phẩm AI",
        "Ngày mua",
        "Thời hạn mua (tháng)",
        "Ngày hết hạn tài khoản",
        "Số slot đã dùng (max 5)",
        "Số slot còn trống",
        "Trạng thái sức chứa",
        "Trạng thái hoạt động",
        "Ghi chú",
      ],
      ...tables.accounts.map((a) => [
        a.accountName,
        a.loginEmail || "",
        a.productName,
        a.purchaseDate,
        String(a.durationMonths),
        a.expiryDate,
        String(a.usedSlots),
        String(a.availableSlots),
        a.slotStatus === "full" ? "Đã đầy 5/5" : a.slotStatus === "available" ? "Còn chỗ" : "Trống",
        a.status === "active" ? "Đang hoạt động" : a.status === "expired" ? "Đã hết hạn" : "Ngừng hoạt động",
        a.note || "",
      ]),
    ];

    const subscriptionsData = [
      [
        "Họ tên khách hàng",
        "Email liên hệ",
        "Số điện thoại",
        "Sản phẩm sử dụng",
        "Cấp từ tài khoản gốc",
        "Ngày đăng ký",
        "Thời hạn cấp (tháng)",
        "Ngày hết hạn sử dụng",
        "Trạng thái hoạt động",
        "Ghi chú đăng ký",
      ],
      ...tables.subscriptions.map((s) => [
        s.customerName,
        s.customerEmail || "",
        s.customerPhone || "",
        s.productName,
        s.accountName,
        s.registrationDate,
        String(s.durationMonths),
        s.expiryDate,
        s.status === "active" ? "Đang hoạt động" : s.status === "expired" ? "Đã hết hạn" : "Đã hủy",
        s.note || "",
      ]),
    ];

    // 3. Đẩy dữ liệu mới lên (Batch Update)
    const updateBody = {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: "'1. Sản phẩm AI'!A1",
          values: productsData,
        },
        {
          range: "'2. Tài khoản gốc'!A1",
          values: accountsData,
        },
        {
          range: "'3. Khách hàng & Cấp phát'!A1",
          values: subscriptionsData,
        },
      ],
    };

    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
      }
    );
    if (!updateRes.ok) throw new Error("Lỗi khi ghi dữ liệu mới lên Google Sheets.");
  },
};
