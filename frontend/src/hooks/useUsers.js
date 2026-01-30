import { useQuery } from "@tanstack/react-query";
import { userService } from "@/services/user.service";

export const userKeys = {
  all: ["users"],
  list: () => [...userKeys.all, "list"],
};

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: userService.getAll,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
