import { Suspense } from "react";

import { ScreenSkeleton } from "@/components/app/screen-skeleton";
import { InviteScreen } from "@/features/rooms/invite-screen";

export default function InvitePage() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <InviteScreen />
    </Suspense>
  );
}
