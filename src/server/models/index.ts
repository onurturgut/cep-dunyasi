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
    specs: {
      type: new Schema(
        {
          operatingSystem: { type: String, default: null },
          internalStorage: { type: String, default: null },
          ram: { type: String, default: null },
          frontCamera: { type: String, default: null },
          rearCamera: { type: String, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
    second_hand: {
      type: new Schema(
        {
          condition: { type: String, default: null },
          battery_health: { type: Number, default: null, min: 0, max: 100 },
          warranty_type: { type: String, default: null },
          warranty_remaining_months: { type: Number, default: null, min: 0 },
          includes_box: { type: Boolean, default: false },
          includes_invoice: { type: Boolean, default: false },
          included_accessories: { type: [String], default: [] },
          face_id_status: { type: String, default: null },
          true_tone_status: { type: String, default: null },
          battery_changed: { type: Boolean, default: null },
          changed_parts: { type: [String], default: [] },
          cosmetic_notes: { type: String, default: null },
          inspection_summary: { type: String, default: null },
          inspection_date: { type: Date, default: null },
          imei: { type: String, default: null },
          serial_number: { type: String, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
    starting_price: { type: Number, default: 0 },
    sales_count: { type: Number, default: 0, index: true },
    rating_average: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    rating_distribution: {
      type: new Schema(
        {
          "1": { type: Number, default: 0 },
          "2": { type: Number, default: 0 },
          "3": { type: Number, default: 0 },
          "4": { type: Number, default: 0 },
          "5": { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: () => ({
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
      }),
    },
    is_featured: { type: Boolean, default: false, index: true },
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
    color_name: { type: String, default: "Standart" },
    color_code: { type: String, default: null },
    storage: { type: String, default: "Standart" },
    ram: { type: String, default: null },
    attributes: { type: Schema.Types.Mixed, default: {} },
    option_signature: { type: String, required: true, index: true },
    price: { type: Number, required: true, default: 0, min: 0 },
    compare_at_price: { type: Number, default: null, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    stock_alert_threshold: { type: Number, default: 5, min: 0 },
    images: { type: [String], default: [] },
    barcode: { type: String, default: null },
    sort_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

productVariantSchema.index({ product_id: 1, is_active: 1, sort_order: 1 });
productVariantSchema.index(
  { product_id: 1, option_signature: 1 },
  { unique: true, partialFilterExpression: { option_signature: { $type: "string" } } }
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
    status_history: {
      type: [
        new Schema(
          {
            status: { type: String, required: true },
            note: { type: String, default: null },
            changed_by_user_id: { type: String, default: null },
            created_at: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    admin_note: { type: String, default: null },
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
    variant_sku: { type: String, default: null },
    variant_attributes: { type: Schema.Types.Mixed, default: null },
    variant_image: { type: String, default: null },
    product_name: { type: String, required: true },
    variant_info: { type: String, default: null },
    quantity: { type: Number, required: true, default: 1 },
    unit_price: { type: Number, required: true, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const productReviewSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    product_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    order_id: { type: String, default: null, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: null, maxlength: 120 },
    comment: { type: String, required: true, trim: true, minlength: 5 },
    images: { type: [String], default: [] },
    is_verified_purchase: { type: Boolean, default: false, index: true },
    is_approved: { type: Boolean, default: false, index: true },
    helpful_count: { type: Number, default: 0 },
    helpful_user_ids: { type: [String], default: [] },
    admin_reply: {
      type: new Schema(
        {
          message: { type: String, required: true, trim: true, maxlength: 1500 },
          created_at: { type: Date, required: true },
          updated_at: { type: Date, required: true },
        },
        { _id: false }
      ),
      default: null,
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

productReviewSchema.index({ product_id: 1, created_at: -1 });
productReviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
productReviewSchema.index({ rating: 1 });

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
    hero_title_highlight: { type: String, default: "Gücünü" },
    hero_title_suffix: { type: String, default: "ile keşfet" },
    hero_subtitle: { type: String, default: "Premium telefon ve aksesuarlar" },
    hero_logo_light_url: { type: String, default: "" },
    hero_logo_dark_url: { type: String, default: "" },
    hero_cta_label: { type: String, default: "Ürünleri İncele" },
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
    category_banner_enabled: { type: Boolean, default: true },
    category_banner_main_image: { type: String, default: "" },
    category_banner_video: { type: String, default: "" },
    category_banner_video_link: { type: String, default: "" },
    category_banner_badge_text: { type: String, default: "Brand Finance 2025" },
    category_banner_intro_text: { type: String, default: "Premium teknoloji vitrini, güven veren marka konumlanması ve temiz bir sunum diliyle desteklenir." },
    category_banner_brand_title: { type: String, default: "Türkiye'nin En Değerli Markaları Arasında!" },
    category_banner_stat_1_label: { type: String, default: "Odak" },
    category_banner_stat_1_value: { type: String, default: "Premium mobil deneyim" },
    category_banner_stat_2_label: { type: String, default: "Konum" },
    category_banner_stat_2_value: { type: String, default: "Güçlü marka algısı" },
    category_banner_highlight_label: { type: String, default: "Öne Çıkan Vurgu" },
    category_banner_brand_desc_1: {
      type: String,
      default: 'Uluslararası marka değerlendirme kuruluşu Brand Finance\'in "Türkiye 2025" raporunda Reeder, ülkemizin en değerli ve en güçlü markaları arasında yerini aldı.',
    },
    category_banner_brand_desc_2: { type: String, default: 'Brand Finance "Türkiye 2025" listesinde' },
    category_banner_brand_desc_3: { type: String, default: "Reeder, Türkiye'nin en değerli 3. cihaz üreticisi konumunda." },
    category_banner_slots: { type: [String], default: [] },
    explore_section_title: { type: String, default: "Kategorileri Keşfet" },
    featured_section_title: { type: String, default: "Öne Çıkan Ürünler" },
    featured_section_cta_label: { type: String, default: "Tüm Ürünleri Gör" },
    featured_section_cta_href: { type: String, default: "/products" },
    slug: { type: String, default: null, index: true },
    title: { type: String, default: null },
    meta_title: { type: String, default: null },
    meta_description: { type: String, default: null },
    summary: { type: String, default: null },
    content: { type: String, default: null },
    sections: { type: [Schema.Types.Mixed], default: [] },
    faq_items: {
      type: [
        new Schema(
          {
            id: { type: String, default: () => randomUUID() },
            question: { type: String, required: true },
            answer: { type: String, required: true },
            category: { type: String, default: null },
            order: { type: Number, default: 0 },
            is_active: { type: Boolean, default: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    contact_blocks: {
      type: [
        new Schema(
          {
            id: { type: String, default: () => randomUUID() },
            label: { type: String, required: true },
            value: { type: String, required: true },
            href: { type: String, default: null },
            icon: { type: String, default: null },
            description: { type: String, default: null },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    is_published: { type: Boolean, default: true, index: true },
    robots_noindex: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const technicalServiceRequestSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    user_id: { type: String, default: null, index: true },
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, index: true },
    phone_number: { type: String, required: true, trim: true, index: true },
    phone_model: { type: String, required: true, trim: true },
    issue_description: { type: String, required: true, trim: true },
    photo_url: { type: String, default: "" },
    photo_name: { type: String, default: "" },
    status: { type: String, default: "new", index: true },
    admin_note: { type: String, default: null },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const userAddressSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), index: true },
    title: { type: String, required: true, trim: true },
    full_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    address_line: { type: String, required: true, trim: true },
    postal_code: { type: String, default: "", trim: true },
    is_default: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const communicationPreferencesSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, default: "" },
    first_name: { type: String, default: "", trim: true },
    last_name: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true, index: true },
    profile_image_url: { type: String, default: null },
    communication_preferences: { type: communicationPreferencesSchema, default: () => ({ email: true, sms: false }) },
    addresses: { type: [userAddressSchema], default: [] },
    roles: { type: [String], default: ["customer"] },
    permissions: { type: [String], default: [] },
    is_active: { type: Boolean, default: true, index: true },
    last_login_at: { type: Date, default: null },
    wishlist_product_ids: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const bannerCampaignSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    placement: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: null, trim: true },
    description: { type: String, default: null, trim: true },
    image_url: { type: String, required: true, trim: true },
    mobile_image_url: { type: String, default: null, trim: true },
    cta_label: { type: String, default: null, trim: true },
    cta_href: { type: String, default: null, trim: true },
    badge_text: { type: String, default: null, trim: true },
    badge_color: { type: String, default: null, trim: true },
    start_at: { type: Date, default: null, index: true },
    end_at: { type: Date, default: null, index: true },
    is_active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

bannerCampaignSchema.index({ placement: 1, is_active: 1, sort_order: 1 });
bannerCampaignSchema.index({ start_at: 1, end_at: 1 });

const auditLogSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    actor_user_id: { type: String, required: true, index: true },
    actor_email: { type: String, default: null, index: true },
    action_type: { type: String, required: true, index: true },
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: String, default: null, index: true },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

auditLogSchema.index({ action_type: 1, created_at: -1 });
auditLogSchema.index({ actor_user_id: 1, created_at: -1 });

const returnRequestSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    order_id: { type: String, required: true, index: true },
    order_item_id: { type: String, required: true, index: true },
    product_name: { type: String, required: true, trim: true },
    variant_info: { type: String, default: null, trim: true },
    request_type: { type: String, enum: ["return", "exchange"], required: true, index: true },
    reason_code: { type: String, required: true, trim: true },
    reason_text: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending", index: true },
    admin_note: { type: String, default: null, trim: true },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

returnRequestSchema.index({ user_id: 1, created_at: -1 });
returnRequestSchema.index({ user_id: 1, order_id: 1 });
returnRequestSchema.index({ user_id: 1, order_item_id: 1 }, { unique: true });

export const Category: any = models.Category || model("Category", categorySchema);
export const Product: any = models.Product || model("Product", productSchema);
export const ProductVariant: any = models.ProductVariant || model("ProductVariant", productVariantSchema);
export const Coupon: any = models.Coupon || model("Coupon", couponSchema);
export const Order: any = models.Order || model("Order", orderSchema);
export const OrderItem: any = models.OrderItem || model("OrderItem", orderItemSchema);
export const ProductReview: any = models.ProductReview || model("ProductReview", productReviewSchema);
export const Shipment: any = models.Shipment || model("Shipment", shipmentSchema);
export const MissionItem: any = models.MissionItem || model("MissionItem", missionItemSchema);
export const SiteContent: any = models.SiteContent || model("SiteContent", siteContentSchema);
export const TechnicalServiceRequest: any =
  models.TechnicalServiceRequest || model("TechnicalServiceRequest", technicalServiceRequestSchema);
export const User: any = models.User || model("User", userSchema);
export const ReturnRequest: any = models.ReturnRequest || model("ReturnRequest", returnRequestSchema);
export const BannerCampaign: any = models.BannerCampaign || model("BannerCampaign", bannerCampaignSchema);
export const AuditLog: any = models.AuditLog || model("AuditLog", auditLogSchema);

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
  | "technical_service_requests"
  | "return_requests"
  | "users"
  | "product_reviews"
  | "banner_campaigns"
  | "audit_logs";

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
  return_requests: ReturnRequest,
  users: User,
  product_reviews: ProductReview,
  banner_campaigns: BannerCampaign,
  audit_logs: AuditLog,
};
