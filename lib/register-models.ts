/**
 * Side-effect imports so every Mongoose model is registered before populate() runs.
 * Without this, routes that only import e.g. Product can throw:
 * "Schema hasn't been registered for model \"User\"".
 */
import "@/models/User";
import "@/models/Product";
import "@/models/Order";
import "@/models/Notification";
import "@/models/BulkPool";
import "@/models/AggregatedProduct";
