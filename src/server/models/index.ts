import { randomUUID } from "node:crypto";
import { Schema, model, models } from "mongoose";

const categorySchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    parent_category_id: { type: String, default: null, index: true },
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
    model: { type: String, default: "", index: true },
    description: { type: String, default: "" },
    category_id: { type: String, default: null, index: true },
    subcategory_id: { type: String, default: null, index: true },
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
          screenSize: { type: String, default: null },
          displayTechnology: { type: String, default: null },
          refreshRate: { type: String, default: null },
          resolution: { type: String, default: null },
          processor: { type: String, default: null },
          batteryCapacity: { type: String, default: null },
          fastCharging: { type: String, default: null },
          wirelessCharging: { type: String, default: null },
          network5g: { type: String, default: null },
          nfc: { type: String, default: null },
          esim: { type: String, default: null },
          dualSim: { type: String, default: null },
          bluetooth: { type: String, default: null },
          wifi: { type: String, default: null },
          waterResistance: { type: String, default: null },
          biometricSecurity: { type: String, default: null },
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
    case_details: {
      type: new Schema(
        {
          case_type: { type: String, default: null },
          case_theme: { type: String, default: null },
          feature_tags: { type: [String], default: [] },
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

productSchema.index({ is_active: 1, category_id: 1, created_at: -1 });
productSchema.index({ is_active: 1, subcategory_id: 1, created_at: -1 });
productSchema.index({ is_active: 1, is_featured: 1, created_at: -1 });
productSchema.index({ is_active: 1, brand: 1, created_at: -1 });
productSchema.index({ is_active: 1, model: 1, created_at: -1 });
productSchema.index({ category_id: 1, subcategory_id: 1, is_active: 1 });

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
productVariantSchema.index({ product_id: 1, sku: 1 });
productVariantSchema.index({ product_id: 1, stock: 1, is_active: 1 });
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
    payment_method: { type: String, default: "credit_card_3ds", index: true },
    payment_provider: { type: String, default: "iyzico" },
    payment_status: { type: String, default: "pending" },
    payment_reference_id: { type: String, default: null },
    payment_conversation_id: { type: String, default: null, index: true },
    payment_transaction_id: { type: String, default: null },
    payment_attempts_count: { type: Number, default: 0 },
    last_payment_attempt_at: { type: Date, default: null },
    payment_failure_reason: { type: String, default: null },
    is_retryable_payment: { type: Boolean, default: true },
    billing_info: { type: Schema.Types.Mixed, default: null },
    notification_summary: {
      type: new Schema(
        {
          email: { type: String, default: null },
          sms: { type: String, default: null },
        },
        { _id: false }
      ),
      default: () => ({ email: null, sms: null }),
    },
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

orderSchema.index({ user_id: 1, created_at: -1 });
orderSchema.index({ order_status: 1, created_at: -1 });
orderSchema.index({ payment_status: 1, created_at: -1 });
orderSchema.index({ payment_method: 1, created_at: -1 });
orderSchema.index({ payment_transaction_id: 1 }, { sparse: true, unique: true });

const paymentAttemptSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    order_id: { type: String, required: true, index: true },
    provider: { type: String, required: true, default: "iyzico", index: true },
    payment_method: { type: String, required: true, default: "credit_card_3ds", index: true },
    attempt_number: { type: Number, required: true, min: 1 },
    status: { type: String, default: "started", index: true },
    started_at: { type: Date, default: Date.now, index: true },
    completed_at: { type: Date, default: null },
    failure_reason: { type: String, default: null },
    provider_reference: { type: String, default: null },
    conversation_id: { type: String, default: null, index: true },
    transaction_id: { type: String, default: null },
    checkout_token: { type: String, default: null, index: true },
    payment_page_url: { type: String, default: null },
    raw_response_summary: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

paymentAttemptSchema.index({ order_id: 1, attempt_number: 1 }, { unique: true });
paymentAttemptSchema.index({ order_id: 1, status: 1, created_at: -1 });
paymentAttemptSchema.index({ provider_reference: 1 }, { sparse: true });
paymentAttemptSchema.index({ transaction_id: 1 }, { sparse: true, unique: true });

const notificationSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    user_id: { type: String, default: null, index: true },
    related_order_id: { type: String, default: null, index: true },
    type: { type: String, required: true, index: true },
    channel: { type: String, required: true, enum: ["email", "sms"], index: true },
    recipient: { type: String, required: true },
    subject: { type: String, default: null },
    message: { type: String, required: true },
    status: { type: String, default: "queued", index: true },
    sent_at: { type: Date, default: null },
    error_message: { type: String, default: null },
    provider_response_summary: { type: Schema.Types.Mixed, default: null },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

notificationSchema.index({ related_order_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ status: 1, created_at: -1 });

const newsletterSubscriberSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    first_name: { type: String, default: null },
    source: { type: String, default: "footer", index: true },
    campaign_source: { type: String, default: null, index: true },
    is_verified: { type: Boolean, default: false, index: true },
    consent_newsletter: { type: Boolean, default: true },
    consent_kvkk: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

newsletterSubscriberSchema.index({ source: 1, created_at: -1 });

const socialProofItemSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    label: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    icon: { type: String, default: null },
    description: { type: String, default: null },
    source_type: { type: String, default: "manual", index: true },
    is_active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

socialProofItemSchema.index({ is_active: 1, sort_order: 1 });

const marketingSettingSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    newsletter_enabled: { type: Boolean, default: true },
    newsletter_title: { type: String, default: "Kampanyaları ilk sen öğren" },
    newsletter_description: {
      type: String,
      default: "Yeni ürünler, premium koleksiyonlar ve sessizce gelen indirimler için e-posta listemize katıl.",
    },
    newsletter_success_message: {
      type: String,
      default: "Kaydın tamamlandı. Yeni kampanyaları sana e-posta ile haber vereceğiz.",
    },
    newsletter_consent_label: { type: String, default: "Kampanya ve ürün bilgilendirmelerini almak istiyorum." },
    whatsapp_enabled: { type: Boolean, default: true },
    whatsapp_phone: { type: String, default: "" },
    whatsapp_message: { type: String, default: "Merhaba, Cep Dünyası ürünleri hakkında bilgi almak istiyorum." },
    whatsapp_help_text: { type: String, default: "Yardım ister misin?" },
    whatsapp_show_on_mobile: { type: Boolean, default: true },
    whatsapp_show_on_desktop: { type: Boolean, default: true },
    live_support_enabled: { type: Boolean, default: false },
    live_support_provider: { type: String, default: "none" },
    live_support_script_url: { type: String, default: null },
    live_support_widget_id: { type: String, default: null },
    live_support_show_on_mobile: { type: Boolean, default: false },
    live_support_show_on_desktop: { type: Boolean, default: true },
    loyalty_enabled: { type: Boolean, default: true },
    loyalty_points_per_currency: { type: Number, default: 1, min: 0 },
    referral_enabled: { type: Boolean, default: true },
    referral_reward_points: { type: Number, default: 250, min: 0 },
    low_stock_threshold: { type: Number, default: 5, min: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const marketingEventSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    user_id: { type: String, default: null, index: true },
    session_id: { type: String, default: null, index: true },
    event_type: { type: String, required: true, index: true },
    entity_type: { type: String, default: null, index: true },
    entity_id: { type: String, default: null, index: true },
    page_path: { type: String, default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

marketingEventSchema.index({ event_type: 1, created_at: -1 });
marketingEventSchema.index({ entity_type: 1, entity_id: 1, created_at: -1 });

const loyaltyTransactionSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    points: { type: Number, required: true },
    order_id: { type: String, default: null, index: true },
    description: { type: String, required: true },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

loyaltyTransactionSchema.index({ user_id: 1, created_at: -1 });

const referralSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    referrer_user_id: { type: String, required: true, index: true },
    referred_user_id: { type: String, default: null },
    referral_code: { type: String, required: true, index: true },
    status: { type: String, default: "registered", index: true },
    reward_type: { type: String, default: "loyalty_points" },
    reward_value: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now, index: true },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

referralSchema.index({ referrer_user_id: 1, created_at: -1 });
referralSchema.index({ referred_user_id: 1 }, { sparse: true, unique: true });

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

shipmentSchema.index({ order_id: 1, created_at: -1 });
shipmentSchema.index({ tracking_number: 1 }, { sparse: true });

const siteContentSchema = new Schema(
  {
    id: { type: String, default: () => randomUUID(), unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    hero_title_prefix: { type: String, default: "" },
    hero_title_highlight: { type: String, default: "" },
    hero_title_suffix: { type: String, default: "" },
    hero_subtitle: { type: String, default: "" },
    hero_logo_light_url: { type: String, default: "" },
    hero_logo_dark_url: { type: String, default: "" },
    hero_cta_label: { type: String, default: "" },
    hero_cta_href: { type: String, default: "" },
    shipping_fee: { type: Number, default: 0 },
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
    category_section_title: { type: String, default: "" },
    category_section_description: { type: String, default: "" },
    category_banner_enabled: { type: Boolean, default: false },
    category_banner_main_image: { type: String, default: "" },
    category_banner_video: { type: String, default: "" },
    category_banner_video_link: { type: String, default: "" },
    category_banner_badge_text: { type: String, default: "" },
    category_banner_intro_text: { type: String, default: "" },
    category_banner_brand_title: { type: String, default: "" },
    category_banner_stat_1_label: { type: String, default: "" },
    category_banner_stat_1_value: { type: String, default: "" },
    category_banner_stat_2_label: { type: String, default: "" },
    category_banner_stat_2_value: { type: String, default: "" },
    category_banner_highlight_label: { type: String, default: "" },
    category_banner_brand_desc_1: { type: String, default: "" },
    category_banner_brand_desc_2: { type: String, default: "" },
    category_banner_brand_desc_3: { type: String, default: "" },
    category_banner_slots: { type: [String], default: [] },
    explore_section_title: { type: String, default: "" },
    featured_section_title: { type: String, default: "" },
    featured_section_cta_label: { type: String, default: "" },
    featured_section_cta_href: { type: String, default: "" },
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

siteContentSchema.index({ is_published: 1, slug: 1 });
siteContentSchema.index({ is_published: 1, updated_at: -1 });

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

technicalServiceRequestSchema.index({ user_id: 1, status: 1, created_at: -1 });
technicalServiceRequestSchema.index({ status: 1, created_at: -1 });

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
    email_verified: { type: Boolean, default: false, index: true },
    email_verified_at: { type: Date, default: null },
    email_verification_token_hash: { type: String, default: null, index: true },
    email_verification_expires_at: { type: Date, default: null, index: true },
    email_verification_sent_at: { type: Date, default: null },
    password_reset_code_hash: { type: String, default: null, index: true },
    password_reset_expires_at: { type: Date, default: null, index: true },
    password_reset_sent_at: { type: Date, default: null },
    last_login_at: { type: Date, default: null },
    wishlist_product_ids: { type: [String], default: [] },
    loyalty_points_balance: { type: Number, default: 0, index: true },
    referral_code: { type: String, default: null, index: true, unique: true, sparse: true },
    referred_by: { type: String, default: null, index: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.index({ is_active: 1, created_at: -1 });

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
    theme_variant: { type: String, default: null, trim: true },
    trigger_type: { type: String, default: "delay", index: true },
    trigger_delay_seconds: { type: Number, default: 4, min: 0 },
    trigger_scroll_percent: { type: Number, default: 40, min: 0, max: 100 },
    show_once_per_session: { type: Boolean, default: true },
    target_paths: { type: [String], default: [] },
    audience: { type: String, default: "all", index: true },
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

function ensureModelSchema(modelName: string, schema: Schema, requiredPaths: string[] = []) {
  const existingModel = models[modelName];

  if (existingModel) {
    const hasAllPaths = requiredPaths.every((path) => Boolean(existingModel.schema.path(path)));

    if (hasAllPaths) {
      return existingModel;
    }

    delete models[modelName];
  }

  return model(modelName, schema);
}

export const Category: any = ensureModelSchema("Category", categorySchema, ["parent_category_id"]);
export const Product: any = ensureModelSchema("Product", productSchema, ["subcategory_id", "case_details", "model", "specs.screenSize"]);
export const ProductVariant: any = models.ProductVariant || model("ProductVariant", productVariantSchema);
export const Coupon: any = models.Coupon || model("Coupon", couponSchema);
export const Order: any = ensureModelSchema("Order", orderSchema, [
  "payment_method",
  "payment_reference_id",
  "payment_conversation_id",
  "payment_transaction_id",
  "payment_attempts_count",
  "last_payment_attempt_at",
  "payment_failure_reason",
  "is_retryable_payment",
  "billing_info",
  "notification_summary",
]);
export const OrderItem: any = models.OrderItem || model("OrderItem", orderItemSchema);
export const PaymentAttempt: any = ensureModelSchema("PaymentAttempt", paymentAttemptSchema, [
  "order_id",
  "payment_method",
  "attempt_number",
  "provider_reference",
  "checkout_token",
]);
export const Notification: any = ensureModelSchema("Notification", notificationSchema, [
  "related_order_id",
  "channel",
  "status",
]);
export const NewsletterSubscriber: any = ensureModelSchema("NewsletterSubscriber", newsletterSubscriberSchema, [
  "campaign_source",
  "consent_newsletter",
  "consent_kvkk",
]);
export const SocialProofItem: any = ensureModelSchema("SocialProofItem", socialProofItemSchema, [
  "source_type",
  "sort_order",
  "is_active",
]);
export const MarketingSetting: any = ensureModelSchema("MarketingSetting", marketingSettingSchema, [
  "newsletter_enabled",
  "whatsapp_phone",
  "live_support_provider",
  "referral_reward_points",
]);
export const MarketingEvent: any = ensureModelSchema("MarketingEvent", marketingEventSchema, [
  "session_id",
  "entity_type",
  "page_path",
]);
export const LoyaltyTransaction: any = ensureModelSchema("LoyaltyTransaction", loyaltyTransactionSchema, [
  "user_id",
  "type",
  "order_id",
]);
export const Referral: any = ensureModelSchema("Referral", referralSchema, [
  "referrer_user_id",
  "referred_user_id",
  "reward_value",
]);
export const ProductReview: any = models.ProductReview || model("ProductReview", productReviewSchema);
export const Shipment: any = models.Shipment || model("Shipment", shipmentSchema);
export const SiteContent: any = models.SiteContent || model("SiteContent", siteContentSchema);
export const TechnicalServiceRequest: any =
  models.TechnicalServiceRequest || model("TechnicalServiceRequest", technicalServiceRequestSchema);
export const User: any = ensureModelSchema("User", userSchema, [
  "loyalty_points_balance",
  "referral_code",
  "referred_by",
  "email_verified",
  "email_verification_token_hash",
  "email_verification_sent_at",
  "password_reset_code_hash",
  "password_reset_sent_at",
]);
export const ReturnRequest: any = models.ReturnRequest || model("ReturnRequest", returnRequestSchema);
export const BannerCampaign: any = ensureModelSchema("BannerCampaign", bannerCampaignSchema, [
  "theme_variant",
  "trigger_type",
  "trigger_delay_seconds",
  "trigger_scroll_percent",
  "show_once_per_session",
  "target_paths",
  "audience",
]);
export const AuditLog: any = models.AuditLog || model("AuditLog", auditLogSchema);

export type DbTableName =
  | "categories"
  | "products"
  | "product_variants"
  | "coupons"
  | "orders"
  | "payment_attempts"
  | "order_items"
  | "shipments"
  | "site_contents"
  | "technical_service_requests"
  | "return_requests"
  | "users"
  | "product_reviews"
  | "banner_campaigns"
  | "audit_logs"
  | "notifications"
  | "newsletter_subscribers"
  | "social_proof_items"
  | "marketing_settings"
  | "marketing_events"
  | "loyalty_transactions"
  | "referrals";

export const tableModelMap: Record<DbTableName, any> = {
  categories: Category,
  products: Product,
  product_variants: ProductVariant,
  coupons: Coupon,
  orders: Order,
  payment_attempts: PaymentAttempt,
  order_items: OrderItem,
  shipments: Shipment,
  site_contents: SiteContent,
  technical_service_requests: TechnicalServiceRequest,
  return_requests: ReturnRequest,
  users: User,
  product_reviews: ProductReview,
  banner_campaigns: BannerCampaign,
  audit_logs: AuditLog,
  notifications: Notification,
  newsletter_subscribers: NewsletterSubscriber,
  social_proof_items: SocialProofItem,
  marketing_settings: MarketingSetting,
  marketing_events: MarketingEvent,
  loyalty_transactions: LoyaltyTransaction,
  referrals: Referral,
};

