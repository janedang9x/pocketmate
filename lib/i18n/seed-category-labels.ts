import type { Locale } from "@/lib/i18n/types";

/**
 * Vietnamese display names for seed default categories (`user_id IS NULL`).
 * Keys must match English names in `supabase/seed.sql` exactly.
 */
const VI_EXPENSE: Record<string, string> = {
  "Food & Drinks": "Ăn uống",
  Groceries: "Thực phẩm",
  Delivery: "Giao hàng",
  "Dining Out": "Ăn ngoài",
  "Junk Food": "Đồ ăn vặt",
  "Coffee & Drinks": "Cà phê & đồ uống",
  Housing: "Nhà ở",
  "Rent/Mortgage": "Thuê / trả góp nhà",
  Utilities: "Điện nước & tiện ích",
  "Furniture & Appliances": "Nội thất & thiết bị",
  "Property management fee": "Phí quản lý chung cư",
  "Home maintenance": "Sửa chữa nhà",
  Household: "Gia đình",
  "Household Supplies": "Đồ dùng gia đình",
  Helper: "Giúp việc",
  Transportation: "Đi lại",
  Fuel: "Nhiên liệu",
  "Taxi & Public Transportation": "Taxi & xe buýt",
  "Parking & Toll": "Đỗ xe & phí cầu đường",
  "Vehicle maintenance": "Bảo dưỡng xe",
  Children: "Trẻ em",
  "Tuition fee": "Học phí",
  "Education supplies": "Đồ dùng học tập",
  Toys: "Đồ chơi",
  Health: "Sức khỏe",
  "Medical checkups": "Khám sức khỏe",
  Medications: "Thuốc men",
  "Sports & Fitness": "Thể thao & thể hình",
  Lifestyle: "Phong cách sống",
  Travel: "Du lịch",
  "Entertainment & Leisure": "Giải trí",
  "Beauty & Self-care": "Làm đẹp & chăm sóc bản thân",
  "Family & Social": "Gia đình & xã hội",
  Gifts: "Quà tặng",
  "Weddings & Funerals": "Cưới hỏi & tang lễ",
  "Holiday & Festivals (Tet...)": "Lễ Tết",
  "Family gatherings": "Họ hàng",
  "Social gatherings": "Bạn bè & xã giao",
  "Personal Development": "Phát triển bản thân",
  "Courses & Training": "Khóa học & đào tạo",
  Books: "Sách",
  Subscriptions: "Đăng ký dịch vụ",
  Others: "Khác",
  Other: "Khác",
};

const VI_INCOME: Record<string, string> = {
  Salary: "Lương",
  Freelance: "Freelance",
  Investment: "Đầu tư",
  "House rent": "Cho thuê nhà",
  Other: "Khác",
};

export type CategoryKind = "expense" | "income";

/**
 * Localized label for a category row when it is still the seeded default (`user_id` null).
 * Custom or forked categories always show the stored `name`.
 */
export function localizedSeedCategoryName(
  name: string,
  isSystemDefault: boolean,
  locale: Locale,
  kind: CategoryKind,
): string {
  if (!isSystemDefault || locale === "en") {
    return name;
  }
  const map = kind === "expense" ? VI_EXPENSE : VI_INCOME;
  return map[name] ?? name;
}
