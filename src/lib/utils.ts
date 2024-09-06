import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ZodObject, ZodSchema } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>;

export function keysToNullObject<T extends string>(keys: T[]): Record<T, null> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = null;
      return acc;
    },
    {} as Record<T, null>
  );
}

export function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(number, max));
}

export const isDev = () => process.env.NODE_ENV === "development";
