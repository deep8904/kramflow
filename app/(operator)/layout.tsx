import { AuthProvider } from "@/components/auth/auth-context";
import { PinGate } from "@/components/auth/pin-gate";

export default function OperatorGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PinGate>{children}</PinGate>
    </AuthProvider>
  );
}
