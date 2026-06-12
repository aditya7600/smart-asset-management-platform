import { prisma } from "../lib/prisma.js";
import { NotificationType } from "../utils/constants.js";

interface NotifyInput {
  userId: string;
  type?: keyof typeof NotificationType;
  title: string;
  message: string;
  link?: string;
}

// Creates an in-app notification for a user. Email delivery could be plugged in
// here behind the same interface (the design document explains this extension point).
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "INFO",
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed to create notification:", err);
  }
}
