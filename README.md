# 🚀 AI Account Hub - Hệ thống Quản lý Tài khoản Dịch vụ AI & Cấp phát Khách hàng

AI Account Hub là ứng dụng Single Page Application (SPA) viết bằng **React 19 + TypeScript + Vite 8 + Tailwind CSS v4**. Ứng dụng giúp các đơn vị cung cấp dịch vụ AI quản lý tối ưu các tài khoản AI gốc mua theo thời hạn, phân bổ vị trí sử dụng cho khách hàng, theo dõi hạn dùng và thực hiện sao lưu/khôi phục dữ liệu tự động lên đám mây cá nhân.

---

## 🛠️ Công nghệ Sử dụng

- **Core**: React 19, TypeScript (Strict Mode).
- **Bundler & Build Tool**: Vite 8.
- **Styling**: Tailwind CSS v4 (Cấu hình CSS-First, hỗ trợ Light/Dark mode).
- **Form Management**: React Hook Form.
- **Data Validation**: Zod.
- **Date processing**: date-fns (Xử lý cộng tháng và tính hạn dùng chuẩn xác).
- **Cloud Integration**: Google Drive REST API, Google Sheets REST API, Google Identity Services SDK (OAuth2).
- **Icons**: Lucide Icons.
- **Testing**: Vitest (Unit testing cho core logic).

---

## 🏗️ Kiến trúc Thư mục Dự án

```text
src/
  ├── types/               # Định nghĩa các kiểu dữ liệu TypeScript chính
  │   └── index.ts         
  ├── utils/               # Các hàm tiện ích (tính ngày hết hạn, format hiển thị)
  │   └── date.ts          
  ├── storage/             # Tầng đọc/ghi dữ liệu thô xuống localStorage & dữ liệu mẫu
  │   └── localStorage.ts  
  ├── services/            # Tầng logic nghiệp vụ chính (CRUD, tự động cập nhật trạng thái, kiểm tra ràng buộc)
  │   ├── storageService.ts
  │   ├── googleDriveService.ts # Tích hợp Google OAuth2, Google Drive & Google Sheets [MỚI]
  │   └── __tests__/       # Thư mục chứa các tệp tin Unit Test
  │       └── storageService.test.ts
  ├── schemas/             # Zod validation schemas cho các form nhập liệu
  │   └── validation.ts    
  ├── hooks/               # React Context & Custom Hook (useStore) kết nối UI với Services
  │   └── useStore.tsx     
  ├── components/          # Các UI component dùng chung
  │   ├── Layout.tsx       # Khung Layout, Sidebar mobile/desktop, Theme toggle
  │   ├── UIComponents.tsx # Toast, ConfirmDialog, ProgressBar, Badge trạng thái
  │   └── SubscriptionFormModal.tsx # Form phân bổ tài khoản cho khách (2-Column UX)
  ├── pages/               # Các màn hình chính của hệ thống
  │   ├── DashboardPage.tsx # Thống kê các metrics và cảnh báo cần chú ý
  │   ├── ProductsPage.tsx  # Quản lý Sản phẩm AI (ChatGPT, Claude...)
  │   ├── AIAccountsPage.tsx # Quản lý Tài khoản AI gốc (slots, xem chi tiết khách hàng đang liên kết)
  │   ├── CustomersPage.tsx # Quản lý Khách hàng & danh sách đăng ký (Tabbed UI, lịch sử timeline)
  │   └── BackupPage.tsx    # Sao lưu JSON, xuất CSV Excel, cấu hình Google Cloud Sync, reset DB
  ├── App.tsx              # Component gốc và hệ thống điều hướng trang
  ├── main.tsx             # Điểm bắt đầu render ứng dụng
  └── index.css            # Styles chính và tích hợp Tailwind CSS v4
```

---

## 📦 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu hệ thống
- Yêu cầu cài đặt **Node.js** (Khuyến nghị phiên bản v18 trở lên).
- Trình quản lý gói **npm** đi kèm.

### 2. Cài đặt các thư viện phụ thuộc
Di chuyển vào thư mục dự án và chạy lệnh sau để tải các package cần thiết:
```bash
npm install
```

### 3. Chạy ứng dụng ở môi trường Phát triển (Development)
Khởi chạy server local của Vite:
```bash
npm run dev
```
Sau đó, truy cập đường dẫn local hiển thị trên terminal (thường là `http://localhost:5173`) để trải nghiệm ứng dụng.

### 4. Đóng gói sản phẩm (Production Build)
Biên dịch dự án thành các tệp tin tĩnh tối ưu hóa cao trong thư mục `dist`:
```bash
npm run build
```

---

## 🧪 Hướng dẫn Chạy Unit Tests

Chúng tôi đã viết bộ unit test kiểm định tất cả các logic nghiệp vụ quan trọng sử dụng Vitest. Để chạy test, thực hiện lệnh:
```bash
npm run test
```

Các ca kiểm thử được bao phủ bao gồm:
1. Tính ngày hết hạn gói 1, 6 và 12 tháng thông thường.
2. Tính ngày hết hạn chính xác tại các ngày cuối tháng (ví dụ: 31/01 cộng 1 tháng -> 28/02).
3. Tự động thiết lập thời hạn mặc định là 12 tháng khi đăng ký mới cho khách hàng.
4. Chặn cấp slot thứ 6 cho một tài khoản AI gốc (tối đa 5 slots active).
5. Giải phóng slot trống của tài khoản AI gốc khi đăng ký bị hủy (`cancelled`) hoặc hết hạn (`expired`).
6. Chặn cấp phát tài khoản AI gốc đã hết hạn hoặc đang bị vô hiệu hóa (`disabled`).
7. Ngăn chặn tạo đăng ký cho khách hàng có ngày hết hạn vượt quá ngày hết hạn của tài khoản AI gốc cấp phát.

---

## ☁️ Hướng dẫn cấu hình Đồng bộ Đám mây (Google Cloud Sync)

Vì ứng dụng chạy Local-First và Local Server, luồng xác thực Google OAuth2 sẽ diễn ra trực tiếp trên trình duyệt của bạn (an toàn, không thông qua máy chủ trung gian). Để thiết lập:

1. **Tạo Google Client ID**:
   - Truy cập [Google Cloud Console](https://console.cloud.google.com/).
   - Tạo mới một Dự án (Project) hoặc chọn dự án sẵn có.
   - Truy cập mục **APIs & Services** > **Credentials**.
   - Nhấp vào **Create Credentials** > **OAuth client ID**.
   - Chọn Application type là **Web application**.
   - Tại phần **Authorized JavaScript origins**, thêm đường dẫn ứng dụng local của bạn (Ví dụ: `http://localhost:5173`).
   - Nhấn **Create** để nhận chuỗi **Client ID** (dạng `xxxxx.apps.googleusercontent.com`).
2. **Cấu hình trên ứng dụng**:
   - Vào ứng dụng AI Account Hub, chọn trang **Hệ thống & Sao lưu**.
   - Dán **Client ID** vào ô nhập **Google Client ID** và nhấn lưu (ứng dụng tự động ghi nhớ).
   - Nhấn **Kết nối tài khoản Google** và đăng nhập thông qua popup an toàn của Google.
3. **Thao tác đồng bộ**:
   - **Sao lưu lên Google Drive**: Lưu một file `ai_account_hub_backup.json` mã hóa lên Drive của bạn.
   - **Khôi phục từ Drive**: Kéo tệp sao lưu trên Drive về ghi đè lên trình duyệt hiện tại.
   - **Đồng bộ sang Google Sheets**: Tự động tạo/cập nhật bảng tính `AI_Account_Hub_Database` trực tuyến gồm 3 trang tính tương ứng với cơ sở dữ liệu để tiện chia sẻ, quản trị hoặc in ấn.

---

## 💾 Cấu trúc Dữ liệu Hệ thống (Data Models)

Dữ liệu được lưu trữ trực tiếp dưới dạng JSON trong `localStorage` thông qua các bảng thô:

### 1. Sản phẩm AI (`Product`)
```typescript
type Product = {
  id: string;          // Khóa chính (p-xxxx)
  name: string;        // Tên sản phẩm AI (ChatGPT Plus, Claude Pro...)
  description?: string;// Mô tả chi tiết
  isActive: boolean;   // Trạng thái hoạt động kinh doanh
  createdAt: string;   // Thời gian tạo (ISO String)
  updatedAt: string;   // Thời gian cập nhật (ISO String)
};
```

### 2. Tài khoản AI gốc (`AIAccount`)
```typescript
type AIAccount = {
  id: string;          // Khóa chính (acc-xxxx)
  productId: string;   // Khóa ngoại liên kết tới Product
  accountName: string; // Tên gợi nhớ/nhận diện tài khoản
  loginEmail?: string; // Email đăng nhập gốc
  note?: string;       // Ghi chú (mật khẩu, ghi chú gói...)
  purchaseDate: string;// Ngày mua gốc (yyyy-MM-dd)
  durationMonths: 1 | 6 | 12; // Thời hạn gói mua
  expiryDate: string;  // Ngày hết hạn gốc (tự động tính = purchaseDate + durationMonths)
  maxSlots: 5;         // Mặc định luôn là 5
  status: "active" | "expired" | "disabled"; // Trạng thái hoạt động gốc
  createdAt: string;   // Thời gian tạo
  updatedAt: string;   // Thời gian cập nhật
};
```

### 3. Khách hàng (`Customer`)
```typescript
type Customer = {
  id: string;          // Khóa chính (cust-xxxx)
  name: string;        // Họ tên khách hàng (bắt buộc)
  email?: string;      // Email liên hệ
  phone?: string;      // Số điện thoại liên hệ
  note?: string;       // Ghi chú về khách hàng
  createdAt: string;   // Thời gian tạo
  updatedAt: string;   // Thời gian cập nhật
};
```

### 4. Đăng ký Cấp phát (`Subscription`)
```typescript
type Subscription = {
  id: string;          // Khóa chính (sub-xxxx)
  customerId: string;  // Khóa ngoại liên kết tới Customer
  aiAccountId: string; // Khóa ngoại liên kết tới AIAccount
  productId: string;   // Tự động sao chép từ AIAccount.productId
  registrationDate: string; // Ngày đăng ký cấp (yyyy-MM-dd)
  durationMonths: 1 | 6 | 12;  // Thời hạn cấp cho khách
  expiryDate: string;  // Ngày hết hạn của khách (tự động tính = registrationDate + durationMonths)
  status: "active" | "expired" | "cancelled"; // Trạng thái đăng ký
  note?: string;       // Ghi chú đăng ký
  createdAt: string;   // Thời gian tạo
  updatedAt: string;   // Thời gian cập nhật
};
```

---

## 📈 Quy tắc Nghiệp vụ Tự động

1. **Tự động Cập nhật Trạng thái (State Auto-updates)**: Khi mở ứng dụng hoặc khi dữ liệu thay đổi, hệ thống sẽ so sánh ngày hết hạn của tài khoản AI và các đăng ký của khách hàng với ngày hiện tại của hệ thống. Nếu đã qua ngày hết hạn, trạng thái sẽ tự động đổi sang `expired` mà không cần người dùng thao tác thủ công.
2. **Định dạng Ngày tháng**:
   - Lưu trữ nội bộ: Chuẩn ISO `yyyy-MM-dd`.
   - Hiển thị giao diện: Định dạng Việt Nam `dd/MM/yyyy`.
3. **Sao lưu dữ liệu**:
   - Backup/Restore dữ liệu nhanh thông qua tệp JSON hoặc đám mây Google Drive. Hệ thống tự động kiểm tra cấu trúc tệp tin (data validation) trước khi cho phép phục hồi để tránh ghi đè dữ liệu rác.
   - Hỗ trợ xuất dữ liệu sang CSV hỗ trợ Unicode tiếng Việt đầy đủ (dùng BOM `\uFEFF`), mở bằng Excel không bao giờ bị lỗi hiển thị font.
