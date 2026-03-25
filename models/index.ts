/**
 * Central export for Mongoose models — import from "@/models" in API routes.
 */
export { User, type UserDocument } from "./User";
export { Product, type ProductDocument } from "./Product";
export { Order, type OrderDocument } from "./Order";
export {
  AggregatedProduct,
  type AggregatedProductDocument,
} from "./AggregatedProduct";
export {
  Notification,
  type NotificationDocument,
} from "./Notification";
export { BulkPool, type BulkPoolDocument } from "./BulkPool";
