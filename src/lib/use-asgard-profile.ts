import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { completeOnboarding, getMyProfile, type Profile } from "@/lib/loyalty-api";
import { DEMO } from "@/lib/demo";

export function useAsgardProfile() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        let next = await getMyProfile();
        if (!next && typeof window !== "undefined") {
          const rol = sessionStorage.getItem("asgard-rol");
          const dni = sessionStorage.getItem("asgard-dni") ?? "";
          const demo = DEMO.clients.find((c) => c.dni === dni);
          if (rol === "cliente" && dni) {
            next = await completeOnboarding({
              data: {
                role: "client",
                displayName: demo?.name || user.displayName || "Cliente",
                dni,
              },
            });
          } else if (rol === "barbero") {
            next = await completeOnboarding({
              data: {
                role: "barber",
                displayName: user.displayName || DEMO.barber.name,
                joinCode: DEMO.joinCode,
              },
            });
          }
        }
        if (!cancelled) setProfile(next ?? null);
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Error");
          setProfile(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPending, user]);

  return { user, sessionPending: isPending, profile, err };
}
