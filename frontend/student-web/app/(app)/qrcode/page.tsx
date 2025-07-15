import { Suspense } from "react";
import QrCodeClient from "./QrCodeClient";

export default function Page() {
  return (
    <Suspense>
      <QrCodeClient />
    </Suspense>
  );
}
