import { randomUUID } from "node:crypto";
import { Schema, model, models } from "mongoose";

const categorySchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: null },
    description: { type: String, default: "" },
    image_url: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const productSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    category_id: { type: String, default: null, index: true },
    brand: { type: String, default: "" },
    type: { type: String, default: "accessory" },
    images: { type: [String], default: [] },
    is_active: { type: Boolean, default: true, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const productVariantSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    product_id: { type: String, required: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    attributes: { type: Schema.Types.Mixed, default: {} },
    price: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    barcode: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const couponSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
    min_order_amount: { type: Number, default: 0 },
    usage_limit: { type: Number, default: 0 },
    usage_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    expires_at: { type: Date, default: null },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const orderSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    user_id: { type: String, default: null, index: true },
    guest_token: { type: String, default: null },
    total_price: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping_price: { type: Number, default: 0 },
    final_price: { type: Number, default: 0 },
    coupon_id: { type: String, default: null, index: true },
    coupon_code: { type: String, default: null },
    payment_id: { type: String, default: null },
    payment_provider: { type: String, default: "iyzico" },
    payment_status: { type: String, default: "pending" },
    order_status: { type: String, default: "pending" },
    shipping_address: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const orderItemSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    variant_id: { type: String, required: true },
    product_name: { type: String, required: true },
    variant_info: { type: String, default: null },
    quantity: { type: Number, required: true, default: 1 },
    unit_price: { type: Number, required: true, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const shipmentSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    cargo_company: { type: String, default: null },
    tracking_number: { type: String, default: null },
    status: { type: String, default: "preparing" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const missionItemSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    label: { type: String, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    media_type: { type: String, enum: ["image", "video"], default: "image" },
    media_url: { type: String, default: "" },
    media_poster: { type: String, default: "" },
    list_items: { type: [String], default: [] },
    sort_order: { type: Number, default: 0, index: true },
    is_active: { type: Boolean, default: true, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const siteContentSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    hero_title_prefix: { type: String, default: "Teknolojinin" },
    hero_title_highlight: { type: String, default: "Gucunu" },
    hero_title_suffix: { type: String, default: "ile kesfet" },
    hero_subtitle: { type: String, default: "Premium telefon ve aksesuarlar" },
    hero_logo_light_url: { type: String, default: "" },
    hero_logo_dark_url: { type: String, default: "" },
    hero_cta_label: { type: String, default: "Urunleri Incele" },
    hero_cta_href: { type: String, default: "/products" },
    hero_slides: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            image_url: { type: String, default: "" },
            alt: { type: String, default: "" },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    hero_benefits: {
      type: [
        new Schema(
          {
            icon: { type: String, default: "Truck" },
            title: { type: String, default: "" },
            desc: { type: String, default: "" },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    category_section_title: { type: String, default: "Kategoriler" },
    category_section_description: { type: String, default: "" },
    explore_section_title: { type: String, default: "Kategorileri Kesfet" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const technicalServiceRequestSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    phone_number: { type: String, required: true, trim: true, index: true },
    phone_model: { type: String, required: true, trim: true },
    issue_description: { type: String, required: true, trim: true },
    photo_url: { type: String, default: "" },
    photo_name: { type: String, default: "" },
    status: { type: String, default: "new", index: true },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const userSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, default: "" },
    roles: { type: [String], default: ["customer"] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export const Category: any = models.Category || model("Category", categorySchema);
export const Product: any = models.Product || model("Product", productSchema);
export const ProductVariant: any = models.ProductVariant || model("ProductVariant", productVariantSchema);
export const Coupon: any = models.Coupon || model("Coupon", couponSchema);
export const Order: any = models.Order || model("Order", orderSchema);
export const OrderItem: any = models.OrderItem || model("OrderItem", orderItemSchema);
export const Shipment: any = models.Shipment || model("Shipment", shipmentSchema);
export const MissionItem: any = models.MissionItem || model("MissionItem", missionItemSchema);
export const SiteContent: any = models.SiteContent || model("SiteContent", siteContentSchema);
export const TechnicalServiceRequest: any =
  models.TechnicalServiceRequest || model("TechnicalServiceRequest", technicalServiceRequestSchema);
export const User: any = models.User || model("User", userSchema);

export type DbTableName =
  | "categories"
  | "products"
  | "product_variants"
  | "coupons"
  | "orders"
  | "order_items"
  | "shipments"
  | "mission_items"
  | "site_contents"
  | "technical_service_requests";

export const tableModelMap: Record<DbTableName, any> = {
  categories: Category,
  products: Product,
  product_variants: ProductVariant,
  coupons: Coupon,
  orders: Order,
  order_items: OrderItem,
  shipments: Shipment,
  mission_items: MissionItem,
  site_contents: SiteContent,
  technical_service_requests: TechnicalServiceRequest,
};
