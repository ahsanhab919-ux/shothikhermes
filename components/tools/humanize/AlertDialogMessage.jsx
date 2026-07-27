import { Gem, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";

const AlertDialogMessage = ({ onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const isPremium = user?.package && /value_plan|pro_plan|unlimited/.test(user.package);

  return (
    <div className="absolute left-1/2 top-1/2 z-50 flex h-full w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-sm rounded-lg bg-card p-5 text-center text-card-foreground shadow">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-2 text-xl font-semibold">Upgrade</h3>
        <p className="text-sm text-muted-foreground">
          Unlock advanced features and enhance your paraphrasing experience.
        </p>
        {!isPremium && (
          <Link href="/pricing" className="inline-block">
            <Button className="mt-4">
              <Gem className="mr-2 h-4 w-4" /> Upgrade to Premium
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default AlertDialogMessage;
