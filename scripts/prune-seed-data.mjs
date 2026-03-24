import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const AUTH_ENV_FILE = ".env.local";
const TOTAL_PRODUCT_SEED_COUNT = 42;
const BASE_PRODUCT_SLUGS = [
  "iphone-16-pro",
  "iphone-15-pro-max",
  "hizli-usb-c-sarj-aleti",
  "iphone-15",
  "spigen-kilif-airfit",
  "xiaomi-redmi-watch-4",
  "anker-20000-power-bank",
  "yenilenmis-iphone-13",
  "ekran-degisim-servisi",
];
const GENERATED_PRODUCT_PREFIXES = [
  "iphone-15-plus",
  "iphone-14-pro",
  "yenilenmis-cihaz",
  "pulse-watch",
  "armor-kilif",
  "turbo-sarj",
  "max-power-bank",
  "servis-ekran-paketi",
  "servis-batarya-paketi",
  "servis-yazilim-paketi",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function configureDns(mongoUri) {
  if (!mongoUri?.startsWith("mongodb+srv://")) {
    return;
  }

  const servers = (process.env.MONGODB_DNS_SERVERS || "1.1.1.1,8.8.8.8")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

function buildKeepProductSlugs() {
  const generatedProductCount = Math.max(0, TOTAL_PRODUCT_SEED_COUNT - BASE_PRODUCT_SLUGS.length);
  const keepSlugs = new Set(BASE_PRODUCT_SLUGS);

  for (let index = 0; index < generatedProductCount; index += 1) {
    const prefix = GENERATED_PRODUCT_PREFIXES[index % GENERATED_PRODUCT_PREFIXES.length];
    const sequence = Math.floor(index / GENERATED_PRODUCT_PREFIXES.length) + 1;
    keepSlugs.add(`${prefix}-${sequence}`);
  }

  return keepSlugs;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  loadEnvFile(path.join(process.cwd(), AUTH_ENV_FILE));

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  configureDns(mongoUri);

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
    connectTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000),
  });

  const productSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
  const variantSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
  const orderSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
  const orderItemSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
  const shipmentSchema = new mongoose.Schema({}, { strict: false, versionKey: false });

  const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
  const ProductVariant =
    mongoose.models.ProductVariant || mongoose.model("ProductVariant", variantSchema);
  const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
  const OrderItem = mongoose.models.OrderItem || mongoose.model("OrderItem", orderItemSchema);
  const Shipment = mongoose.models.Shipment || mongoose.model("Shipment", shipmentSchema);

  const keepSlugs = buildKeepProductSlugs();
  const generatedSeedSlugMatchers = GENERATED_PRODUCT_PREFIXES.map((prefix) => ({
    slug: { $regex: new RegExp(`^${escapeRegex(prefix)}-\\d+$`) },
  }));

  const removableProducts = await Product.find({
    $and: [
      { $or: generatedSeedSlugMatchers },
      { slug: { $nin: Array.from(keepSlugs) } },
    ],
  })
    .select({ id: 1, slug: 1 })
    .lean();

  const removableProductIds = removableProducts.map((product) => product.id).filter(Boolean);

  let deletedVariantCount = 0;
  let deletedProductCount = 0;

  if (removableProductIds.length > 0) {
    const variantResult = await ProductVariant.deleteMany({
      product_id: { $in: removableProductIds },
    });
    const productResult = await Product.deleteMany({
      id: { $in: removableProductIds },
    });

    deletedVariantCount = variantResult.deletedCount ?? 0;
    deletedProductCount = productResult.deletedCount ?? 0;
  }

  const removableOrders = await Order.find({
    guest_token: { $regex: /^seed-sale-/ },
  })
    .select({ id: 1, guest_token: 1 })
    .lean();

  const removableOrderIds = removableOrders.map((order) => order.id).filter(Boolean);

  let deletedOrderItemCount = 0;
  let deletedShipmentCount = 0;
  let deletedOrderCount = 0;

  if (removableOrderIds.length > 0) {
    const orderItemResult = await OrderItem.deleteMany({
      order_id: { $in: removableOrderIds },
    });
    const shipmentResult = await Shipment.deleteMany({
      order_id: { $in: removableOrderIds },
    });
    const orderResult = await Order.deleteMany({
      id: { $in: removableOrderIds },
    });

    deletedOrderItemCount = orderItemResult.deletedCount ?? 0;
    deletedShipmentCount = shipmentResult.deletedCount ?? 0;
    deletedOrderCount = orderResult.deletedCount ?? 0;
  }

  console.log(
    JSON.stringify(
      {
        deletedProducts: deletedProductCount,
        deletedVariants: deletedVariantCount,
        deletedOrders: deletedOrderCount,
        deletedOrderItems: deletedOrderItemCount,
        deletedShipments: deletedShipmentCount,
        removedProductSlugs: removableProducts.map((product) => product.slug),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
