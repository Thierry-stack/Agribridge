import type mongoose from "mongoose";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";

/**
 * After a new farmer registers, notify them and existing farmers in the same cell
 * so they can coordinate bulk sales.
 */
export async function notifyNearbyFarmersOnRegister(
  newFarmerId: mongoose.Types.ObjectId
): Promise<void> {
  const newFarmer = await User.findById(newFarmerId).lean();
  if (!newFarmer || newFarmer.role !== "farmer" || !newFarmer.locationKey) {
    return;
  }

  const others = await User.find({
    role: "farmer",
    locationKey: newFarmer.locationKey,
    _id: { $ne: newFarmerId },
  }).lean();

  if (others.length === 0) {
    return;
  }

  const otherNames = others.map((o) => o.name).join(", ");
  const areaLabel = `${newFarmer.district} · ${newFarmer.sector} · ${newFarmer.cell}`;

  await Notification.create({
    recipient: newFarmerId,
    type: "nearby_farmers",
    title: "Farmers near you — sell together",
    body: `Other farmers registered in the same cell (${areaLabel}) include: ${otherNames}. You can connect to coordinate and bulk-sell.`,
  });

  for (const o of others) {
    await Notification.create({
      recipient: o._id,
      type: "nearby_farmers_new",
      title: "New farmer in your cell",
      body: `${newFarmer.name} joined your area (${areaLabel}, village: ${newFarmer.village || "—"}). Consider connecting to sell together.`,
    });
  }
}
