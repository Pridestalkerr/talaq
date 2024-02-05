import { isWithinExpiration } from "./utils/date";

export const isValidDatabaseSession = (expires: Date): boolean => {
  return isWithinExpiration(expires.getTime());
};
