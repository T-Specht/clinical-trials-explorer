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

export const omit = <T extends {}, K extends keyof T>(obj: T, ...keys: K[]) =>
  Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;

export const pick = <T extends {}, K extends keyof T>(obj: T, ...keys: K[]) =>
  Object.fromEntries(
    keys.filter((key) => key in obj).map((key) => [key, obj[key]])
  ) as Pick<T, K>;

export const inclusivePick = <T extends {}, K extends string | number | symbol>(
  obj: T,
  ...keys: K[]
) =>
  Object.fromEntries(
    keys.map((key) => [key, obj[key as unknown as keyof T]])
  ) as { [key in K]: key extends keyof T ? T[key] : undefined };
