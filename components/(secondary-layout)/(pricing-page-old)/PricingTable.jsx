import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useGetAppModeQuery } from "@/redux/api/pricing/pricingApi";
import { useSearchParams } from "next/navigation";
import PricingButton from "./PricingButton";

function PricingTable({ user, data, yearly, paymentMethod, country }) {
  const payload = {
    pricing: { title: "Pricing", data: [] },
    features: [],
  };

  payload.features = data[0]
    ? data[0].features
        .map((feature) => feature.type)
        .filter((type, index, self) => self.indexOf(type) === index)
        .map((type) => [type])
    : [];

  data?.forEach((plan, index) => {
    const { features, bn, global } = plan;
    const {
      amount_monthly: priceMonthly,
      amount_yearly: priceYearly,
      yearly_plan_available,
    } = country === "bangladesh" ? bn : country === "india" ? plan.in : global;

    const price = yearly ? priceYearly : priceMonthly;

    payload.pricing.data.push({
      price: price,
      currency:
        country === "bangladesh" ? "৳" : country === "india" ? "₹" : "$",
      plan: yearly ? "yearly" : "monthly",
      description: index === 0 ? "Features you’ll love" : "",
      caption: plan.title,
      subscription: plan.type,
      id: plan._id,
      yearly_plan_available,
    });
    let service = "";
    features.forEach((feature) => {
      const index = payload.features.findIndex(
        (item) => item[0] === feature.type,
      );
      if (index !== -1) {
        if (feature.type === service) {
          const lastElement =
            payload.features[index][payload.features[index].length - 1];
          payload.features[index].pop();
          payload.features[index].push(`${lastElement} || ${feature.title}`);
        } else {
          payload.features[index].push(feature.title);
        }
        service = feature.type;
      }
    });
  });

  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const { data: modeResult, isLoading } = useGetAppModeQuery();

  let modePrice;
  if (country === "bangladesh" || country === "india") {
    modePrice = 1;
  } else {
    modePrice = 0.5;
  }

  function getItem(item) {
    if (item === "bypass") {
      return "Humanize GPT";
    }
    return item;
  }

  if (isLoading) return null;

  return (
    <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
      <Table>
        <TableBody>
          <TableRow className="hidden border-b sm:table-row">
            <TableHead
              scope="row"
              className="border-r py-12 pl-9 text-xl font-semibold whitespace-nowrap"
            >
              {payload.pricing.title}
            </TableHead>
            {payload.pricing.data?.map((item, index) => (
              <TableCell key={index} className="py-12 whitespace-nowrap">
                <div className="mb-4">
                  <span className="text-xs font-bold">
                    <sup className="font-normal">{item.currency}</sup>
                    {/dev|test/.test(modeResult?.data?.appMode)
                      ? modePrice
                      : item.price}
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                      / {item.plan}
                    </span>
                  </span>
                </div>
                <div className="text-muted-foreground -mt-1 h-6 text-sm">
                  {item.description}
                </div>
                <PricingButton
                  user={user}
                  caption={item.caption}
                  id={item.id}
                  paymentMethod={paymentMethod}
                  redirect={redirect}
                  subscription={item.subscription}
                  yearly={yearly}
                  yearly_plan_available={item.yearly_plan_available}
                  outline={true}
                />
              </TableCell>
            ))}
          </TableRow>
          {payload.features.map((feature, index) => {
            return (
              <TableRow key={index}>
                {feature.map((item, itemIndex) => (
                  <TableCell
                    key={itemIndex}
                    className={cn(
                      "align-top",
                      itemIndex === 0
                        ? "border-r pl-2.5 text-xl font-semibold whitespace-nowrap capitalize sm:pl-9"
                        : "text-muted-foreground min-w-[200px] text-base whitespace-pre-line",
                    )}
                  >
                    <div>
                      {item.includes("||")
                        ? item
                            .split("||")
                            .map((value) => {
                              return value.trim();
                            })
                            .join(", \n")
                        : getItem(item)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default PricingTable;
