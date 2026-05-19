import mongoose, { type Document, Schema } from "mongoose";

export interface ISimulation {
  label: string;
  payload: Record<string, unknown>;
  foyerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}

export interface SimulationDocument extends ISimulation, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const simulationSchema = new Schema<SimulationDocument>(
  {
    label: { type: String, required: true, trim: true },
    payload: { type: Schema.Types.Mixed, required: true },
    foyerId: { type: Schema.Types.ObjectId, ref: "Foyer", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

export const Simulation =
  mongoose.models.Simulation ??
  mongoose.model<SimulationDocument>("Simulation", simulationSchema);

export function toSimulationPublic(doc: SimulationDocument) {
  return {
    id: doc._id.toString(),
    label: doc.label,
    payload: doc.payload,
    foyerId: doc.foyerId.toString(),
    userId: doc.userId.toString(),
    createdAt: doc.createdAt.toISOString(),
  };
}
