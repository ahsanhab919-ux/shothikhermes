import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AgentCard = ({ name, description, icon, actions }) => {
  return (
    <Card
      className={cn("m-1 max-w-[340px] min-w-[260px] rounded-lg shadow-md")}
    >
      <CardContent>
        <div className="mb-1 flex items-center">
          {icon && <div className="mr-1 text-[32px] leading-none">{icon}</div>}
          <div className="text-lg font-semibold">{name}</div>
        </div>
        <div className="text-muted-foreground text-sm">{description}</div>
      </CardContent>
      {actions && <div className="px-6 pb-4">{actions}</div>}
    </Card>
  );
};

export default AgentCard;
