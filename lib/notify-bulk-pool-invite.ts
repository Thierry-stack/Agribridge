import type mongoose from "mongoose";
import { Notification } from "@/models/Notification";

export async function notifyBulkPoolInvites(
  poolId: mongoose.Types.ObjectId,
  recipientFarmerIds: mongoose.Types.ObjectId[],
  productType: string,
  totalQuantity: number,
  unit: string
): Promise<void> {
  const body = `A farmer proposed combining supply for ${productType} (${totalQuantity} ${unit} total). Open Alerts to approve and add this pool for large buyers. Pool ID: ${poolId.toString().slice(-6)}.`;

  for (const rid of recipientFarmerIds) {
    await Notification.create({
      recipient: rid,
      type: "bulk_pool_invite",
      title: "Approve bulk pool",
      body,
    });
  }
}
